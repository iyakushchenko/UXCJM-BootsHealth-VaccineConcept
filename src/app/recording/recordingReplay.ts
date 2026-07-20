import type {
  CompiledBeatSegment,
  CompiledRecordingTimeline,
  RecordedEvent,
  RecordingReplayOptions,
  RecordingReplayResult,
  RecordingSession,
} from "@/app/recording/recordingTypes";
import { playbackDiagRecReplay } from "@/app/shell/playbackDiag";

const TRANSPORT_KIND = "transport" as const;
const SCREEN_KIND = "screen" as const;
const DEMO_CLICK_KIND = "demo-click" as const;
const WIRE_INTENT_KIND = "wire-intent" as const;
const DIRECTOR_SCRIPT_KIND = "director-script" as const;

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

/**
 * Auto-play floor between major REC steps (screen / click / transport / …).
 * Capture `atMs` gaps are honored when longer; `stepDelayMs: 0` opts out (tests).
 */
export const RECORDING_REPLAY_MIN_STEP_HOLD_MS = 4000;

/** Scroll uses engine eased timing; only a short settle before the next event. */
const RECORDING_REPLAY_SCROLL_SETTLE_MS = 280;

function isMajorReplayHoldKind(kind: RecordedEvent["kind"]): boolean {
  return (
    kind === "transport" ||
    kind === "screen" ||
    kind === "demo-click" ||
    kind === "wire-intent" ||
    kind === "director-script" ||
    kind === "beat-enter" ||
    kind === "typed-text" ||
    kind === "dwell"
  );
}

/**
 * Hold after a replayed event. Major steps ≥4s (or capture gap / stepDelayMs).
 * Scroll: short settle only — camera motion is the engine ease, not a burst snap.
 */
export function resolveRecordingReplayHoldMs(
  event: RecordedEvent,
  next: RecordedEvent | undefined,
  stepDelayMs: number
): number {
  if (stepDelayMs <= 0) return 0;
  const gap =
    next &&
    typeof next.atMs === "number" &&
    typeof event.atMs === "number" &&
    Number.isFinite(next.atMs) &&
    Number.isFinite(event.atMs)
      ? Math.max(0, next.atMs - event.atMs)
      : 0;
  if (event.kind === "scroll") {
    return Math.max(RECORDING_REPLAY_SCROLL_SETTLE_MS, Math.min(gap, stepDelayMs));
  }
  if (event.kind === "dwell") {
    const dwell = event.durationMs ?? 0;
    return Math.max(RECORDING_REPLAY_MIN_STEP_HOLD_MS, stepDelayMs, dwell, gap);
  }
  if (!isMajorReplayHoldKind(event.kind)) {
    return Math.max(0, stepDelayMs);
  }
  return Math.max(RECORDING_REPLAY_MIN_STEP_HOLD_MS, stepDelayMs, gap);
}

/**
 * Propose beat boundaries from touchpoint markers in a recording.
 * Events between touchpoint markers become segment payloads for future
 * journeys.ts compilation.
 */
export function compileRecordingToBeatTimeline(
  session: RecordingSession
): CompiledRecordingTimeline {
  const segments: CompiledBeatSegment[] = [];
  const preamble: RecordedEvent[] = [];

  let currentSegment: CompiledBeatSegment | null = null;

  for (const event of session.events) {
    if (event.kind === "touchpoint") {
      if (currentSegment) {
        segments.push(currentSegment);
      }
      currentSegment = {
        touchpointKey: event.touchpointKey,
        beatId: event.beatId,
        label: event.label,
        counter: event.counter,
        startedAtMs: event.atMs,
        events: [],
      };
      continue;
    }

    if (currentSegment) {
      currentSegment.events.push(event);
    } else {
      preamble.push(event);
    }
  }

  if (currentSegment) {
    segments.push(currentSegment);
  }

  return {
    sessionId: session.id,
    segments,
    preamble,
  };
}

/**
 * v3 replays transport + screen + dwell + demo-click + wire-intent +
 * director-script + beat-enter + scroll + typed-text (when wired).
 * studio / touchpoint — counted as unsupported (markers only).
 */
export async function replayRecordingSession(
  session: RecordingSession,
  options: RecordingReplayOptions = {}
): Promise<RecordingReplayResult> {
  const result: RecordingReplayResult = {
    replayed: 0,
    skipped: 0,
    unsupported: 0,
    errors: [],
  };

  const trigger = options.triggerTransport;
  const applyScreen = options.applyScreen;
  const applyDemoClick = options.applyDemoClick;
  const applyWireIntent = options.applyWireIntent;
  const applyDirectorScript = options.applyDirectorScript;
  const applyBeatEnter = options.applyBeatEnter;
  const applyScroll = options.applyScroll;
  const applyTypedText = options.applyTypedText;
  if (
    !trigger &&
    !applyScreen &&
    !applyDemoClick &&
    !applyWireIntent &&
    !applyDirectorScript &&
    !applyBeatEnter &&
    !applyScroll &&
    !applyTypedText
  ) {
    result.errors.push(
      "triggerTransport, applyScreen, applyDemoClick, applyWireIntent, applyDirectorScript, applyBeatEnter, applyScroll, or applyTypedText is required for replay"
    );
    return result;
  }

  const stepDelayMs =
    options.stepDelayMs ?? RECORDING_REPLAY_MIN_STEP_HOLD_MS;
  const shouldAbort = options.shouldAbort ?? (() => false);
  const events = session.events;

  for (let i = 0; i < events.length; i += 1) {
    const event = events[i];
    const next = events[i + 1];
    const holdAfter = () =>
      delay(resolveRecordingReplayHoldMs(event, next, stepDelayMs));
    const noteReplay = (ok: boolean, error?: string, selector?: string | null) => {
      if (
        event.kind !== "demo-click" &&
        event.kind !== "screen" &&
        event.kind !== "scroll" &&
        event.kind !== "typed-text" &&
        event.kind !== "transport"
      ) {
        return;
      }
      playbackDiagRecReplay({
        detail: ok
          ? `replay ${event.kind}`
          : `replay FAIL ${event.kind}${error ? `: ${error}` : ""}`,
        eventKind: event.kind,
        selector:
          selector ??
          (event.kind === "demo-click"
            ? event.selectorChain?.[0]
            : event.kind === "screen"
              ? event.screenId
              : event.kind === "scroll"
                ? event.anchorSelector ?? event.selectorChain?.[0]
                : event.kind === "typed-text"
                  ? event.selectorChain?.[0]
                  : event.kind === "transport"
                    ? event.action
                    : null) ?? null,
        ok,
        error,
        index: i,
        total: events.length,
      });
    };

    if (shouldAbort()) {
      result.errors.push("replay aborted");
      break;
    }

    if (event.kind === TRANSPORT_KIND) {
      if (!trigger) {
        result.errors.push(`transport ${event.action}: triggerTransport missing`);
        noteReplay(false, "triggerTransport missing", event.action);
        continue;
      }
      try {
        await trigger(event.action);
        result.replayed += 1;
        noteReplay(true, undefined, event.action);
        await holdAfter();
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        result.errors.push(`transport ${event.action}: ${msg}`);
        noteReplay(false, msg, event.action);
      }
      continue;
    }

    if (event.kind === SCREEN_KIND) {
      if (!applyScreen) {
        result.unsupported += 1;
        noteReplay(false, "applyScreen missing", event.screenId);
        continue;
      }
      try {
        const applied = await applyScreen({
          screenId: event.screenId,
          projectId: event.projectId,
          studioUrl: event.studioUrl,
        });
        if (applied === false) {
          result.skipped += 1;
          result.errors.push(`screen ${event.screenId}: apply returned false`);
          noteReplay(false, "apply returned false", event.screenId);
          continue;
        }
        result.replayed += 1;
        noteReplay(true, undefined, event.screenId);
        await holdAfter();
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        result.errors.push(`screen ${event.screenId}: ${msg}`);
        noteReplay(false, msg, event.screenId);
      }
      continue;
    }

    if (event.kind === "dwell") {
      await holdAfter();
      result.replayed += 1;
      continue;
    }

    if (event.kind === DEMO_CLICK_KIND) {
      if (!applyDemoClick) {
        result.unsupported += 1;
        noteReplay(false, "applyDemoClick missing", event.selectorChain?.[0]);
        continue;
      }
      try {
        const applied = await applyDemoClick({
          element: event.element,
          selectorChain: event.selectorChain,
          beatId: event.beatId,
          touchpointKey: event.touchpointKey,
        });
        if (applied === false) {
          result.skipped += 1;
          result.errors.push(
            `demo-click ${event.element}: target not found or click failed`
          );
          noteReplay(
            false,
            "target not found or click failed",
            event.selectorChain?.[0]
          );
          continue;
        }
        result.replayed += 1;
        noteReplay(true, undefined, event.selectorChain?.[0]);
        await holdAfter();
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        result.errors.push(`demo-click ${event.element}: ${msg}`);
        noteReplay(false, msg, event.selectorChain?.[0]);
      }
      continue;
    }

    if (event.kind === WIRE_INTENT_KIND) {
      if (!applyWireIntent) {
        result.unsupported += 1;
        continue;
      }
      try {
        const applied = await applyWireIntent({
          intentId: event.intentId,
          payload: event.payload,
        });
        if (applied === false) {
          result.skipped += 1;
          result.errors.push(
            `wire-intent ${event.intentId}: apply returned false`
          );
          continue;
        }
        result.replayed += 1;
        await holdAfter();
      } catch (err) {
        result.errors.push(
          `wire-intent ${event.intentId}: ${err instanceof Error ? err.message : String(err)}`
        );
      }
      continue;
    }

    if (event.kind === DIRECTOR_SCRIPT_KIND) {
      if (!applyDirectorScript) {
        result.unsupported += 1;
        continue;
      }
      try {
        const applied = await applyDirectorScript({
          scriptId: event.scriptId,
          scriptKind: event.scriptKind,
          beatId: event.beatId,
          manual: event.manual,
        });
        if (applied === false) {
          result.skipped += 1;
          result.errors.push(
            `director-script ${event.scriptId}: apply returned false`
          );
          continue;
        }
        result.replayed += 1;
        await holdAfter();
      } catch (err) {
        result.errors.push(
          `director-script ${event.scriptId}: ${
            err instanceof Error ? err.message : String(err)
          }`
        );
      }
      continue;
    }

    if (event.kind === "beat-enter") {
      if (!applyBeatEnter) {
        result.unsupported += 1;
        continue;
      }
      try {
        const applied = await applyBeatEnter({
          actionId: event.actionId,
          beatId: event.beatId,
        });
        if (applied === false) {
          result.skipped += 1;
          result.errors.push(
            `beat-enter ${event.actionId}: apply returned false`
          );
          continue;
        }
        result.replayed += 1;
        await holdAfter();
      } catch (err) {
        result.errors.push(
          `beat-enter ${event.actionId}: ${
            err instanceof Error ? err.message : String(err)
          }`
        );
      }
      continue;
    }

    if (event.kind === "scroll") {
      const scrollSel =
        event.anchorSelector ?? event.selectorChain?.[0] ?? null;
      if (!applyScroll) {
        result.unsupported += 1;
        noteReplay(false, "applyScroll missing", scrollSel);
        continue;
      }
      try {
        const applied = await applyScroll({
          selectorChain: event.selectorChain,
          anchorSelector: event.anchorSelector,
          scrollTop: event.scrollTop,
        });
        if (applied === false) {
          result.skipped += 1;
          result.errors.push("scroll: apply returned false");
          noteReplay(false, "apply returned false", scrollSel);
          continue;
        }
        result.replayed += 1;
        noteReplay(true, undefined, scrollSel);
        await holdAfter();
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        result.errors.push(`scroll: ${msg}`);
        noteReplay(false, msg, scrollSel);
      }
      continue;
    }

    if (event.kind === "typed-text") {
      if (!applyTypedText) {
        result.unsupported += 1;
        noteReplay(false, "applyTypedText missing", event.selectorChain?.[0]);
        continue;
      }
      try {
        const applied = await applyTypedText({
          value: event.value,
          selectorChain: event.selectorChain,
          element: event.element,
          inputType: event.inputType,
        });
        if (applied === false) {
          result.skipped += 1;
          result.errors.push(
            `typed-text ${event.element ?? "field"}: target not found or apply failed`
          );
          noteReplay(
            false,
            "target not found or apply failed",
            event.selectorChain?.[0]
          );
          continue;
        }
        result.replayed += 1;
        noteReplay(true, undefined, event.selectorChain?.[0]);
        await holdAfter();
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        result.errors.push(
          `typed-text ${event.element ?? "field"}: ${msg}`
        );
        noteReplay(false, msg, event.selectorChain?.[0]);
      }
      continue;
    }

    result.unsupported += 1;
  }

  return result;
}

/** Summarize what a session would compile to — useful for MCP inspection. */
export function summarizeRecordingSession(session: RecordingSession): {
  eventCount: number;
  byKind: Record<string, number>;
  touchpointCount: number;
  transportCount: number;
  screenCount: number;
  demoClickCount: number;
  wireIntentCount: number;
  directorScriptCount: number;
  beatEnterCount: number;
  scrollCount: number;
  typedTextCount: number;
  durationMs: number | null;
} {
  const byKind: Record<string, number> = {};
  for (const event of session.events) {
    byKind[event.kind] = (byKind[event.kind] ?? 0) + 1;
  }

  const first = session.events[0]?.atMs;
  const last = session.events[session.events.length - 1]?.atMs;
  const durationMs =
    first != null && last != null && last >= first ? last - first : null;

  return {
    eventCount: session.events.length,
    byKind,
    touchpointCount: byKind.touchpoint ?? 0,
    transportCount: byKind.transport ?? 0,
    screenCount: byKind.screen ?? 0,
    demoClickCount: byKind["demo-click"] ?? 0,
    wireIntentCount: byKind["wire-intent"] ?? 0,
    directorScriptCount: byKind["director-script"] ?? 0,
    beatEnterCount: byKind["beat-enter"] ?? 0,
    scrollCount: byKind.scroll ?? 0,
    typedTextCount: byKind["typed-text"] ?? 0,
    durationMs,
  };
}
