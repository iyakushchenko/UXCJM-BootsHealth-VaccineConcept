/**
 * Cursor engine SSoT — park / travel / visibility policy for any CJM / REC /
 * director / chat (same spirit as camera engine in playbackScroll.ts).
 *
 * Implementation of Motion travel + DOM lives in `demoCursor.ts`.
 * This module owns **policy**: travel-to-rest by default; hard snap only via
 * explicit `force` or first-mount (no start pose). Abrupt snap attempts are
 * coerced to travel and logged as FAIL-class QA rows.
 *
 * @see docs/shell/PLAYBACK.md § Cursor engine SSoT
 * @see docs/product/MOTION.md § Robo-cursor travel
 */

import { playbackDiagCursor } from "@/app/shell/playbackDiag";

/** Park travel duration — easeInOut via Motion (no bounce). */
export const CURSOR_ENGINE_PARK_TRAVEL_MS = 520;

/** CTA / director travel duration (shared rail). */
export const CURSOR_ENGINE_TRAVEL_MS = 780;

export type CursorParkReason =
  | "journey-park"
  | "type-in-park"
  | "legacy-fade-path"
  | "suppressed-hold-at-last-click"
  | "first-mount"
  | "force-snap"
  | "abrupt-coerced"
  | (string & {});

export type CursorParkDecision = {
  /** True → Motion travel-to-rest; false → intentional seed/snap. */
  animate: boolean;
  /** Caller asked animate:false without force while a start pose existed. */
  abruptAttempt: boolean;
  /** Effective park reason for diag / QA. */
  reason: CursorParkReason;
  /** first-mount | force | travel | abrupt-coerced */
  mode: "first-mount" | "force" | "travel" | "abrupt-coerced";
};

export type ResolveCursorParkOptions = {
  /**
   * Intentional hard snap — first remount / revive / resize / observe teardown /
   * type-in re-seed when already mid-flight. Required to bypass travel-to-rest.
   */
  force?: boolean;
  /**
   * @deprecated Prefer omit (travel) or `force` (snap). `animate: false` without
   * `force` is treated as an abrupt attempt → coerced to travel + QA FAIL row.
   */
  animate?: boolean;
  /** Human/diag reason (journey-park, retreat, jump-to-start, …). */
  reason?: string;
  /** Cursor already has finite left/top. */
  hasStartPos: boolean;
  /** Already wearing parked class at a stable pose — no-op reassert. */
  alreadyParked?: boolean;
};

/**
 * Resolve park policy. Callers must not invent a second snap path.
 */
export function resolveCursorParkDecision(
  options: ResolveCursorParkOptions
): CursorParkDecision {
  const reasonBase = (options.reason?.trim() || "journey-park") as CursorParkReason;

  if (options.alreadyParked && options.hasStartPos && !options.force) {
    return {
      animate: false,
      abruptAttempt: false,
      reason: reasonBase,
      mode: "travel", // no move — hold pose
    };
  }

  // No pose yet → first mount seed (intentional snap).
  if (!options.hasStartPos) {
    return {
      animate: false,
      abruptAttempt: false,
      reason: options.reason?.trim()
        ? reasonBase
        : ("first-mount" as CursorParkReason),
      mode: "first-mount",
    };
  }

  if (options.force === true) {
    return {
      animate: false,
      abruptAttempt: false,
      reason: reasonBase,
      mode: "force",
    };
  }

  // Legacy animate:false without force = abrupt teleport ban → coerce travel.
  if (options.animate === false) {
    return {
      animate: true,
      abruptAttempt: true,
      reason: "abrupt-coerced",
      mode: "abrupt-coerced",
    };
  }

  // Default + animate:true → travel-to-rest.
  return {
    animate: true,
    abruptAttempt: false,
    reason: reasonBase,
    mode: "travel",
  };
}

/** Lean QA trackers for cursor engine (deduped — not park-spam flood). */
export type CursorEngineTracker =
  | "park-rest"
  | "park-force"
  | "abrupt-park"
  | "type-in-hold"
  | "cancel-settle";

let lastCursorEngineTrackerKey: string | null = null;
let lastCursorEngineTrackerAt = 0;
const CURSOR_ENGINE_TRACKER_DEDUPE_MS = 480;

/**
 * Lean cursor-engine diag rows. Abrupt = always emit (FAIL class, short dedupe).
 * Park-rest / park-force = milestone only (deduped).
 */
export function logCursorEngineTracker(
  tag: CursorEngineTracker,
  options?: { reason?: string; beatId?: string | null; detail?: string }
): void {
  const detail =
    options?.detail ??
    `cursor-engine:${tag}${options?.reason ? ` — ${options.reason}` : ""}`;
  const now =
    typeof performance !== "undefined" ? performance.now() : Date.now();
  const isAbrupt = tag === "abrupt-park";
  const dedupeMs = isAbrupt ? 120 : CURSOR_ENGINE_TRACKER_DEDUPE_MS;
  if (
    detail === lastCursorEngineTrackerKey &&
    now - lastCursorEngineTrackerAt < dedupeMs
  ) {
    return;
  }
  lastCursorEngineTrackerKey = detail;
  lastCursorEngineTrackerAt = now;
  try {
    playbackDiagCursor({
      detail: isAbrupt
        ? `ABRUPT-PARK FAIL — ${detail}`
        : detail,
      parked: tag === "park-rest" || tag === "park-force" || tag === "type-in-hold",
      parkReason: options?.reason ?? tag,
      beatId: options?.beatId,
      action: "park",
    });
  } catch {
    /* hang-safe */
  }
}

export function resetCursorEngineTrackerForTests(): void {
  lastCursorEngineTrackerKey = null;
  lastCursorEngineTrackerAt = 0;
}
