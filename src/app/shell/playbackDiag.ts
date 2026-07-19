/**
 * PLAYBACK_DIAG — console-first CJM playback diagnostics.
 *
 * Contract: every type-in / step / retreat path logs here so Quinn can prove
 * regressions without guessing. See docs/shell/PLAYBACK_DIAG.md.
 *
 * Console:
 *   window.__studioPlaybackDiag()
 *   window.__studioAssertTypeIn({ minChars?: number, minSamples?: number })
 *   window.__studioPlaybackDiagClear()
 */

export type PlaybackDiagKind =
  | "type-in-start"
  | "type-in-progress"
  | "type-in-end"
  | "type-in-skip"
  | "step-forward"
  | "step-back"
  | "retreat-sync"
  | "transport"
  | "info";

export type PlaybackDiagEvent = {
  t: number;
  kind: PlaybackDiagKind;
  surface?: string;
  detail?: string;
  chars?: number;
  targetChars?: number;
  beatId?: string | null;
  counter?: string | null;
};

const MAX_EVENTS = 200;
const events: PlaybackDiagEvent[] = [];
let typeInActive: {
  surface: string;
  startedAt: number;
  targetChars: number;
  samples: number[];
} | null = null;

function now(): number {
  return typeof performance !== "undefined" ? performance.now() : Date.now();
}

function push(event: Omit<PlaybackDiagEvent, "t">): PlaybackDiagEvent {
  const full: PlaybackDiagEvent = { t: now(), ...event };
  events.push(full);
  if (events.length > MAX_EVENTS) events.shift();
  // Always mirror to console — PO: "all diagnostics in console".
  console.info("[PLAYBACK_DIAG]", full.kind, {
    surface: full.surface,
    detail: full.detail,
    chars: full.chars,
    targetChars: full.targetChars,
    beatId: full.beatId,
    counter: full.counter,
  });
  return full;
}

export function playbackDiagClear(): void {
  events.length = 0;
  typeInActive = null;
  console.info("[PLAYBACK_DIAG]", "clear");
}

export function playbackDiagLog(
  kind: PlaybackDiagKind,
  detail?: string,
  extra?: Partial<PlaybackDiagEvent>
): void {
  push({ kind, detail, ...extra });
}

/** Mark CJM type-in start (Home / Chat composer). */
export function playbackDiagTypeInStart(
  surface: string,
  targetChars: number,
  detail?: string
): void {
  typeInActive = {
    surface,
    startedAt: now(),
    targetChars,
    samples: [0],
  };
  push({
    kind: "type-in-start",
    surface,
    targetChars,
    chars: 0,
    detail: detail ?? `type-in start → ${targetChars} chars`,
  });
}

/** Sample current typed length during animation. */
export function playbackDiagTypeInProgress(chars: number): void {
  if (!typeInActive) return;
  typeInActive.samples.push(chars);
  // Throttle console noise — log every 16 chars or completion-ish.
  if (chars % 16 === 0 || chars === typeInActive.targetChars) {
    push({
      kind: "type-in-progress",
      surface: typeInActive.surface,
      chars,
      targetChars: typeInActive.targetChars,
    });
  }
}

export function playbackDiagTypeInEnd(ok: boolean, detail?: string): void {
  const active = typeInActive;
  typeInActive = null;
  push({
    kind: "type-in-end",
    surface: active?.surface,
    chars: active?.samples[active.samples.length - 1],
    targetChars: active?.targetChars,
    detail:
      detail ??
      (ok
        ? `type-in ok (${active?.samples.length ?? 0} samples, ${Math.round(
            now() - (active?.startedAt ?? now())
          )}ms)`
        : "type-in failed / aborted"),
  });
}

/** Forbidden skip path — logged so regressions are obvious. */
export function playbackDiagTypeInSkip(surface: string, reason: string): void {
  push({
    kind: "type-in-skip",
    surface,
    detail: reason,
  });
}

export type PlaybackDiagBundle = {
  events: PlaybackDiagEvent[];
  typeInActive: typeof typeInActive;
  typeIn: {
    starts: number;
    ends: number;
    skips: number;
    lastStart?: PlaybackDiagEvent;
    lastEnd?: PlaybackDiagEvent;
    progressSamples: number[];
  };
  step: {
    forwards: number;
    backs: number;
    retreatSyncs: number;
  };
};

export function getPlaybackDiagBundle(): PlaybackDiagBundle {
  const typeStarts = events.filter((e) => e.kind === "type-in-start");
  const typeEnds = events.filter((e) => e.kind === "type-in-end");
  const typeSkips = events.filter((e) => e.kind === "type-in-skip");
  const progressSamples = events
    .filter((e) => e.kind === "type-in-progress" && typeof e.chars === "number")
    .map((e) => e.chars as number);

  return {
    events: [...events],
    typeInActive,
    typeIn: {
      starts: typeStarts.length,
      ends: typeEnds.length,
      skips: typeSkips.length,
      lastStart: typeStarts[typeStarts.length - 1],
      lastEnd: typeEnds[typeEnds.length - 1],
      progressSamples,
    },
    step: {
      forwards: events.filter((e) => e.kind === "step-forward").length,
      backs: events.filter((e) => e.kind === "step-back").length,
      retreatSyncs: events.filter((e) => e.kind === "retreat-sync").length,
    },
  };
}

export type TypeInAssertOptions = {
  /** Minimum unique char lengths observed during type-in (default 3). */
  minSamples?: number;
  /** Minimum final chars (default 8). */
  minChars?: number;
  /** Fail if any type-in-skip was logged since clear (default true). */
  failOnSkip?: boolean;
};

export type TypeInAssertResult = {
  pass: boolean;
  reason?: string;
  bundle: PlaybackDiagBundle;
};

export function assertPlaybackTypeIn(
  options?: TypeInAssertOptions
): TypeInAssertResult {
  const minSamples = options?.minSamples ?? 3;
  const minChars = options?.minChars ?? 8;
  const failOnSkip = options?.failOnSkip ?? true;
  const bundle = getPlaybackDiagBundle();

  if (failOnSkip && bundle.typeIn.skips > 0) {
    const result = {
      pass: false,
      reason: `type-in-skip logged (${bundle.typeIn.skips}) — prefilled skip is forbidden in CJM`,
      bundle,
    };
    console.info("[PLAYBACK_DIAG]", "assertTypeIn FAIL", result.reason);
    return result;
  }

  if (bundle.typeIn.starts < 1) {
    const result = {
      pass: false,
      reason: "no type-in-start events",
      bundle,
    };
    console.info("[PLAYBACK_DIAG]", "assertTypeIn FAIL", result.reason);
    return result;
  }

  const unique = [...new Set(bundle.typeIn.progressSamples)];
  if (unique.length < minSamples) {
    const result = {
      pass: false,
      reason: `type-in progress samples ${unique.length} < minSamples ${minSamples} (unique=${JSON.stringify(unique)})`,
      bundle,
    };
    console.info("[PLAYBACK_DIAG]", "assertTypeIn FAIL", result.reason);
    return result;
  }

  const maxChars = Math.max(0, ...unique);
  if (maxChars < minChars) {
    const result = {
      pass: false,
      reason: `type-in max chars ${maxChars} < minChars ${minChars}`,
      bundle,
    };
    console.info("[PLAYBACK_DIAG]", "assertTypeIn FAIL", result.reason);
    return result;
  }

  const result = { pass: true, bundle };
  console.info("[PLAYBACK_DIAG]", "assertTypeIn PASS", {
    starts: bundle.typeIn.starts,
    uniqueSamples: unique.length,
    maxChars,
  });
  return result;
}

export function installPlaybackDiagWindowApis(): void {
  const w = window as Window & {
    __studioPlaybackDiag?: () => PlaybackDiagBundle;
    __studioPlaybackDiagClear?: () => void;
    __studioAssertTypeIn?: (options?: TypeInAssertOptions) => TypeInAssertResult;
    __protoPlaybackDiag?: () => PlaybackDiagBundle;
    __protoPlaybackDiagClear?: () => void;
    __protoAssertTypeIn?: (options?: TypeInAssertOptions) => TypeInAssertResult;
  };
  w.__studioPlaybackDiag = getPlaybackDiagBundle;
  w.__studioPlaybackDiagClear = playbackDiagClear;
  w.__studioAssertTypeIn = assertPlaybackTypeIn;
  w.__protoPlaybackDiag = getPlaybackDiagBundle;
  w.__protoPlaybackDiagClear = playbackDiagClear;
  w.__protoAssertTypeIn = assertPlaybackTypeIn;
}

export function uninstallPlaybackDiagWindowApis(): void {
  const w = window as Window & {
    __studioPlaybackDiag?: unknown;
    __studioPlaybackDiagClear?: unknown;
    __studioAssertTypeIn?: unknown;
    __protoPlaybackDiag?: unknown;
    __protoPlaybackDiagClear?: unknown;
    __protoAssertTypeIn?: unknown;
  };
  delete w.__studioPlaybackDiag;
  delete w.__studioPlaybackDiagClear;
  delete w.__studioAssertTypeIn;
  delete w.__protoPlaybackDiag;
  delete w.__protoPlaybackDiagClear;
  delete w.__protoAssertTypeIn;
}
