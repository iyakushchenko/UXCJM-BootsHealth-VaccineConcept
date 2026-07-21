/**
 * REC scroll-stop detector — pure, unit-tested.
 *
 * While recording, watch the prototype scroll host. After meaningful movement
 * settles for ≥ {@link SCROLL_STOP_DWELL_MS} with no meaningful Δpx, emit a
 * stop signal (compile → `kind: "camera"` dwell / pause wait).
 *
 * Jiggles (small Δpx / short ups-downs) are NOT activity.
 */

/** Settled pause after scroll before emitting a camera wait (tunable). */
export const SCROLL_STOP_DWELL_MS = 2000;

/** |ΔscrollTop| below this is ignored as jiggle. */
export const SCROLL_JIGGLE_PX = 12;

/** Window for detecting short up/down oscillations as non-activity. */
export const SCROLL_JIGGLE_WINDOW_MS = 400;

export type ScrollStopTracker = {
  lastTop: number | null;
  /** Last time a meaningful (non-jiggle) move was observed. */
  lastMeaningfulAtMs: number | null;
  /** True once meaningful scroll happened since last emitted stop. */
  armed: boolean;
  /** Recent signed deltas for oscillation filter. */
  recent: Array<{ atMs: number; delta: number }>;
  /** Prevent double-fire for the same quiet stretch. */
  lastEmittedAtMs: number | null;
  /**
   * After a stop emit, ignore re-arms until scrollTop leaves this settle band.
   * Stops one long pause minting N camera waits from layout jiggle / momentum.
   */
  settledTop: number | null;
};

export type ScrollStopSignal = {
  /** Pause length to stamp on the camera beat (at least SCROLL_STOP_DWELL_MS). */
  dwellMs: number;
  scrollTop: number;
  atMs: number;
};

/** |ΔscrollTop| from last settle required before a new wait may arm. */
export const SCROLL_SETTLE_REARM_PX = SCROLL_JIGGLE_PX * 3;

export function createScrollStopTracker(): ScrollStopTracker {
  return {
    lastTop: null,
    lastMeaningfulAtMs: null,
    armed: false,
    recent: [],
    lastEmittedAtMs: null,
    settledTop: null,
  };
}

export function resetScrollStopTracker(tracker: ScrollStopTracker): void {
  tracker.lastTop = null;
  tracker.lastMeaningfulAtMs = null;
  tracker.armed = false;
  tracker.recent = [];
  tracker.lastEmittedAtMs = null;
  tracker.settledTop = null;
}

/** Absolute delta below jiggle threshold → not meaningful. */
export function isJiggleDelta(
  deltaPx: number,
  jigglePx: number = SCROLL_JIGGLE_PX
): boolean {
  return Math.abs(deltaPx) < jigglePx;
}

/**
 * Short ups-downs within {@link SCROLL_JIGGLE_WINDOW_MS} with small net travel
 * are NOT meaningful activity (finger/trackpad chatter).
 */
export function isShortOscillation(
  recent: ReadonlyArray<{ atMs: number; delta: number }>,
  atMs: number,
  options?: { windowMs?: number; jigglePx?: number }
): boolean {
  const windowMs = options?.windowMs ?? SCROLL_JIGGLE_WINDOW_MS;
  const jigglePx = options?.jigglePx ?? SCROLL_JIGGLE_PX;
  const slice = recent.filter((r) => atMs - r.atMs <= windowMs);
  if (slice.length < 2) return false;
  const signs = new Set(slice.map((r) => Math.sign(r.delta) || 0));
  // Need both directions present.
  if (!(signs.has(1) && signs.has(-1))) return false;
  const net = slice.reduce((sum, r) => sum + r.delta, 0);
  return Math.abs(net) < jigglePx * 2;
}

export function isMeaningfulScrollActivity(
  deltaPx: number,
  recent: ReadonlyArray<{ atMs: number; delta: number }>,
  atMs: number,
  options?: { jigglePx?: number; windowMs?: number }
): boolean {
  if (isJiggleDelta(deltaPx, options?.jigglePx)) return false;
  if (isShortOscillation(recent, atMs, options)) return false;
  return true;
}

/**
 * Feed a scrollTop sample. Returns a stop signal when quiet ≥ dwell after
 * meaningful movement (caller usually drives this via a timer + idle tick).
 */
export function noteScrollSample(
  tracker: ScrollStopTracker,
  scrollTop: number,
  atMs: number,
  options?: {
    jigglePx?: number;
    windowMs?: number;
    stopDwellMs?: number;
  }
): ScrollStopSignal | null {
  const stopDwellMs = options?.stopDwellMs ?? SCROLL_STOP_DWELL_MS;
  const prev = tracker.lastTop;
  tracker.lastTop = scrollTop;

  if (prev == null) {
    return maybeEmitStop(tracker, atMs, stopDwellMs);
  }

  const delta = scrollTop - prev;
  tracker.recent.push({ atMs, delta });
  // Keep a small ring so oscillation checks stay cheap.
  const windowMs = options?.windowMs ?? SCROLL_JIGGLE_WINDOW_MS;
  tracker.recent = tracker.recent.filter((r) => atMs - r.atMs <= windowMs * 3);

  if (
    isMeaningfulScrollActivity(delta, tracker.recent, atMs, {
      jigglePx: options?.jigglePx,
      windowMs,
    })
  ) {
    // Still inside the post-emit settle band → one wait per pause (no N beats).
    if (
      tracker.settledTop != null &&
      Math.abs(scrollTop - tracker.settledTop) < SCROLL_SETTLE_REARM_PX
    ) {
      return null;
    }
    tracker.settledTop = null;
    tracker.lastMeaningfulAtMs = atMs;
    tracker.armed = true;
    // New activity invalidates a pending emit for this stretch.
    tracker.lastEmittedAtMs = null;
    return null;
  }

  return maybeEmitStop(tracker, atMs, stopDwellMs);
}

/**
 * Idle tick (no new scroll events) — call when a stop timer fires so a quiet
 * host still emits after {@link SCROLL_STOP_DWELL_MS}.
 */
export function noteScrollIdle(
  tracker: ScrollStopTracker,
  atMs: number,
  options?: { stopDwellMs?: number }
): ScrollStopSignal | null {
  return maybeEmitStop(
    tracker,
    atMs,
    options?.stopDwellMs ?? SCROLL_STOP_DWELL_MS
  );
}

function maybeEmitStop(
  tracker: ScrollStopTracker,
  atMs: number,
  stopDwellMs: number
): ScrollStopSignal | null {
  if (!tracker.armed || tracker.lastMeaningfulAtMs == null) return null;
  if (tracker.lastTop == null) return null;
  const quietMs = atMs - tracker.lastMeaningfulAtMs;
  if (quietMs < stopDwellMs) return null;
  // One emit per quiet stretch.
  if (
    tracker.lastEmittedAtMs != null &&
    tracker.lastEmittedAtMs >= tracker.lastMeaningfulAtMs
  ) {
    return null;
  }
  tracker.lastEmittedAtMs = atMs;
  // Stay armed so a later longer dwell isn't required; disarm until next move.
  tracker.armed = false;
  tracker.settledTop = tracker.lastTop;
  return {
    dwellMs: Math.max(stopDwellMs, quietMs),
    scrollTop: tracker.lastTop,
    atMs,
  };
}
