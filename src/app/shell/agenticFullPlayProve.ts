/**
 * One prove entrypoint — full agentic continuous Play (CJM).
 *
 * Unlike `__protoRunAgenticPlaySmoke` (tears down overlay via withMcpTestSession),
 * this path ALWAYS forceClear → fresh arm → Play → assert peak 21/21 + play-end
 * at start → pauseForAgentLeave, and **keeps** QA overlay visible for Save Log.
 */

import {
  DEFAULT_PREARM_MS,
  forceClearAgentTestingOverlay,
  logAgentTestingOverlay,
  pauseForAgentLeave,
  preArmAgentTestingOverlay,
  startAgentTestingOverlay,
  touchAgentTestingOverlay,
  type AgentLeavePauseResult,
} from "@/app/shell/agent-testing";
import {
  beginMcpTestSession,
  endMcpTestSession,
  getMcpTestSession,
  requestMcpTestAbort,
} from "@/app/shell/mcpTestGuard";
import {
  disableCursorQaEyes,
  enableCursorQaEyes,
} from "@/app/shell/playbackCursorDiagnostic";
import type { PlayEndAtStartAssertResult } from "@/app/shell/playbackDiag";
import {
  runPlayJourneyToStartSmoke,
  type PlayJourneySmokeResult,
} from "@/app/shell/playJourneySmoke";

/** Agentic CJM playlist length (STEPS peak must reach this). */
export const AGENTIC_FULL_PLAY_EXPECTED_PEAK = 21;

/**
 * Default Play poll budget for full agentic prove.
 * Full 21-beat agentic Play commonly needs ~75–120s+ (type-in, thinking, settles);
 * 180s was borderline and short MCP/agent budgets caused false FAIL mid-playlist.
 * Agents may still pass a higher `timeoutMs` (e.g. 600_000).
 */
export const AGENTIC_FULL_PLAY_PROVE_DEFAULT_TIMEOUT_MS = 300_000;

export type AgenticFullPlayProvePeak = {
  visible: number;
  total: number;
  counter: string | null;
};

export type AgenticFullPlayProveResult = {
  pass: boolean;
  peak: AgenticFullPlayProvePeak;
  end: PlayEndAtStartAssertResult | null;
  errors: string[];
  /** Leave result — overlay stays open for Save Log. */
  leave?: AgentLeavePauseResult;
  /** Raw smoke payload (debug; do not invent green from this alone). */
  smoke?: PlayJourneySmokeResult;
};

export type AgenticFullPlayProveOptions = {
  /** Play poll budget — default {@link AGENTIC_FULL_PLAY_PROVE_DEFAULT_TIMEOUT_MS}. */
  timeoutMs?: number;
  softFailPoAlarm?: boolean;
  /** Default {@link AGENTIC_FULL_PLAY_EXPECTED_PEAK} (21). */
  expectedPeak?: number;
  /** Override pre-arm countdown (tests may pass 0). */
  preArmMs?: number;
  delay?: (ms: number) => Promise<void>;
};

function delayMs(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function parsePeak(
  counter: string | null | undefined,
  visibleFallback = 0
): AgenticFullPlayProvePeak {
  if (!counter) {
    return { visible: visibleFallback, total: 0, counter: null };
  }
  const match = /(\d+)\s*\/\s*(\d+)/.exec(counter);
  if (!match) {
    return { visible: visibleFallback, total: 0, counter };
  }
  return {
    visible: Number(match[1]),
    total: Number(match[2]),
    counter,
  };
}

/**
 * Full agentic continuous Play prove — agents MUST use this (not ad-hoc Play).
 *
 * Window: `__studioRunAgenticFullPlayProve` / `__protoRunAgenticFullPlayProve`.
 */
export async function runAgenticFullPlayProve(
  options?: AgenticFullPlayProveOptions
): Promise<AgenticFullPlayProveResult> {
  const expectedPeak =
    options?.expectedPeak ?? AGENTIC_FULL_PLAY_EXPECTED_PEAK;
  const timeoutMs =
    options?.timeoutMs ?? AGENTIC_FULL_PLAY_PROVE_DEFAULT_TIMEOUT_MS;
  const delay = options?.delay ?? delayMs;
  const errors: string[] = [];

  // 1) ALWAYS CLEAR prior QA (mandatory).
  forceClearAgentTestingOverlay();

  const prior = getMcpTestSession();
  if (prior) {
    requestMcpTestAbort("superseded");
    endMcpTestSession(prior.id);
  }
  const sessionId = beginMcpTestSession("agentic-full-play-prove");
  enableCursorQaEyes();

  let smoke: PlayJourneySmokeResult | undefined;
  let leave: AgentLeavePauseResult | undefined;
  let peak: AgenticFullPlayProvePeak = {
    visible: 0,
    total: 0,
    counter: null,
  };
  let end: PlayEndAtStartAssertResult | null = null;

  try {
    // 2) Fresh QA arm — overlay usable; do NOT schedule ensure-clear teardown.
    startAgentTestingOverlay("AGENT TESTING — agentic full play prove");
    await preArmAgentTestingOverlay({
      preArmMs: options?.preArmMs ?? DEFAULT_PREARM_MS,
      title: "AGENT TESTING — preparing…",
    });
    touchAgentTestingOverlay("AGENT TESTING — agentic full play prove");
    logAgentTestingOverlay("prove: agentic-full-play (keep overlay)");

    // 3–5) Jump start + continuous Play + play-end assert (shared smoke core).
    smoke = await runPlayJourneyToStartSmoke({
      orchestraMode: "agentic-cjm",
      startBeatId: "agentic-home",
      startScreenId: "site-pilot",
      timeoutMs,
      softFailPoAlarm: options?.softFailPoAlarm,
      delay,
      ensureClean: () => {
        (
          window as Window & { __protoEnsureCleanStudio?: () => void }
        ).__protoEnsureCleanStudio?.();
      },
      setOrchestraMode: (mode) => {
        (
          window as Window & {
            __protoSetOrchestraMode?: (m: string) => void;
          }
        ).__protoSetOrchestraMode?.(mode);
      },
      setJourneyMode: (enabled) =>
        Boolean(
          (
            window as Window & {
              __protoSetJourneyMode?: (on: boolean) => boolean;
            }
          ).__protoSetJourneyMode?.(enabled)
        ),
      triggerTransport: (action) =>
        Boolean(
          (
            window as Window & {
              __protoTriggerTransport?: (a: string) => boolean;
            }
          ).__protoTriggerTransport?.(action)
        ),
      getState: () =>
        (
          window as Window & {
            __protoStudioState?: () => PlayJourneySmokeResult["state"];
          }
        ).__protoStudioState?.(),
    });

    const fromCounter = parsePeak(smoke.peakCounter, smoke.peakVisible ?? 0);
    peak = {
      visible: smoke.peakVisible ?? fromCounter.visible,
      total: fromCounter.total || expectedPeak,
      counter:
        smoke.peakCounter ??
        (smoke.peakVisible != null
          ? `${smoke.peakVisible} / ${fromCounter.total || expectedPeak}`
          : null),
    };
    end = smoke.assert ?? null;

    if (!smoke.pass) {
      errors.push(smoke.reason ?? "play-smoke-failed");
    }
    if (peak.visible < expectedPeak || peak.total !== expectedPeak) {
      errors.push(
        `peak-not-${expectedPeak}/${expectedPeak}: got ${peak.visible}/${peak.total}` +
          (peak.counter ? ` (${peak.counter})` : "")
      );
    }
    if (!end?.pass) {
      errors.push(end?.reason ?? "play-end-at-start-failed");
    }

    // 6) Pause for agent leave — overlay stays open (Save Log usable).
    leave = pauseForAgentLeave();
    if (!leave.ok) {
      errors.push(`leave-failed:${leave.reason ?? "unknown"}`);
    }

    const pass = errors.length === 0;
    logAgentTestingOverlay(
      pass
        ? `prove PASS · peak ${peak.visible}/${peak.total} · play-end at start`
        : `prove FAIL · ${errors.join("; ")}`
    );

    return {
      pass,
      peak,
      end,
      errors,
      leave,
      smoke,
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    errors.push(`exception:${msg}`);
    try {
      leave = pauseForAgentLeave();
    } catch {
      /* hang-safe */
    }
    return { pass: false, peak, end, errors, leave, smoke };
  } finally {
    // Keep overlay — no stop() / forceClear / ensure-clear (unlike withMcpTestSession).
    try {
      disableCursorQaEyes();
    } catch {
      /* hang-safe */
    }
    endMcpTestSession(sessionId);
  }
}
