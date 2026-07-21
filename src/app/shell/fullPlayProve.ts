/**
 * Universal full Play prove — one engine for any CJM.
 *
 * ALWAYS: forceClear → fresh arm → full Play → peak assert → leave pause
 * (keeps QA overlay for Save Log).
 *
 * Prefer `__studioRunFullPlayProve({ journeyId | experience })`.
 * Agentic / Traditional helpers are thin presets only.
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
  beginQaProveMode,
  endQaProveMode,
} from "@/app/shell/agent-testing/agentTestingPresence";
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

export type FullPlayProveExperience = "agentic" | "traditional";

export type FullPlayProvePeak = {
  visible: number;
  total: number;
  counter: string | null;
};

export type FullPlayProveResult = {
  pass: boolean;
  peak: FullPlayProvePeak;
  end: PlayEndAtStartAssertResult | null;
  errors: string[];
  /** Leave result — overlay stays open for Save Log. */
  leave?: AgentLeavePauseResult;
  /** Raw smoke payload (debug; do not invent green from this alone). */
  smoke?: PlayJourneySmokeResult;
  /** Resolved preset / journey id used for this run. */
  journeyId: string;
  experience: FullPlayProveExperience;
};

export type FullPlayProvePeakMode = "exact" | "login-skip-safe";

export type FullPlayProvePreset = {
  experience: FullPlayProveExperience;
  journeyId: string;
  orchestraMode: string;
  startBeatId: string;
  startScreenId: string;
  expectedPeak: number;
  timeoutMs: number;
  peakMode: FullPlayProvePeakMode;
  sessionName: string;
  overlayTitle: string;
};

/** Boots reference presets — other CJMs pass explicit start/peak overrides. */
export const FULL_PLAY_PROVE_PRESETS: Record<
  FullPlayProveExperience,
  FullPlayProvePreset
> = {
  agentic: {
    experience: "agentic",
    journeyId: "agentic-cjm",
    orchestraMode: "agentic-cjm",
    startBeatId: "agentic-home",
    startScreenId: "site-pilot",
    expectedPeak: 22,
    timeoutMs: 300_000,
    peakMode: "exact",
    sessionName: "full-play-prove",
    overlayTitle: "AGENT TESTING — full play prove",
  },
  traditional: {
    experience: "traditional",
    journeyId: "traditional-cjm",
    orchestraMode: "traditional-cjm",
    startBeatId: "traditional-plp",
    startScreenId: "plp",
    expectedPeak: 13,
    timeoutMs: 180_000,
    peakMode: "login-skip-safe",
    sessionName: "full-play-prove",
    overlayTitle: "AGENT TESTING — full play prove",
  },
};

/** @deprecated Prefer FULL_PLAY_PROVE_PRESETS.agentic.expectedPeak */
export const AGENTIC_FULL_PLAY_EXPECTED_PEAK =
  FULL_PLAY_PROVE_PRESETS.agentic.expectedPeak;
/** @deprecated Prefer FULL_PLAY_PROVE_PRESETS.agentic.timeoutMs */
export const AGENTIC_FULL_PLAY_PROVE_DEFAULT_TIMEOUT_MS =
  FULL_PLAY_PROVE_PRESETS.agentic.timeoutMs;
/** @deprecated Prefer FULL_PLAY_PROVE_PRESETS.traditional.expectedPeak */
export const TRADITIONAL_FULL_PLAY_EXPECTED_PEAK =
  FULL_PLAY_PROVE_PRESETS.traditional.expectedPeak;
/** @deprecated Prefer FULL_PLAY_PROVE_PRESETS.traditional.timeoutMs */
export const TRADITIONAL_FULL_PLAY_PROVE_DEFAULT_TIMEOUT_MS =
  FULL_PLAY_PROVE_PRESETS.traditional.timeoutMs;

export type FullPlayProveOptions = {
  /**
   * Built-in journey id (`agentic-cjm` / `traditional-cjm`) or free recorded id.
   * When omitted, {@link experience} (default agentic) selects the preset.
   */
  journeyId?: string;
  /** Thin experience preset — ignored when journeyId maps to a known preset. */
  experience?: FullPlayProveExperience;
  timeoutMs?: number;
  softFailPoAlarm?: boolean;
  expectedPeak?: number;
  /**
   * Traditional login-skip: accept peak.total from smoke if ≥ expectedPeak−1
   * and visible reached end. Default true for traditional preset.
   */
  allowLoginSkipPeak?: boolean;
  preArmMs?: number;
  delay?: (ms: number) => Promise<void>;
  /** Override preset start (recorded / custom CJMs). */
  startBeatId?: string;
  startScreenId?: string;
  orchestraMode?: string;
  peakMode?: FullPlayProvePeakMode;
};

function delayMs(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function parsePeak(
  counter: string | null | undefined,
  visibleFallback = 0
): FullPlayProvePeak {
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

function resolveExperience(
  options?: FullPlayProveOptions
): FullPlayProveExperience {
  if (options?.experience === "traditional" || options?.experience === "agentic") {
    return options.experience;
  }
  const id = options?.journeyId ?? options?.orchestraMode ?? "";
  if (
    id === "traditional-cjm" ||
    id === "traditional" ||
    String(id).includes("trad")
  ) {
    return "traditional";
  }
  return "agentic";
}

function resolvePreset(options?: FullPlayProveOptions): FullPlayProvePreset {
  const experience = resolveExperience(options);
  const base = FULL_PLAY_PROVE_PRESETS[experience];
  const journeyId = options?.journeyId ?? base.journeyId;
  return {
    ...base,
    experience,
    journeyId,
    orchestraMode: options?.orchestraMode ?? journeyId ?? base.orchestraMode,
    startBeatId: options?.startBeatId ?? base.startBeatId,
    startScreenId: options?.startScreenId ?? base.startScreenId,
    expectedPeak: options?.expectedPeak ?? base.expectedPeak,
    timeoutMs: options?.timeoutMs ?? base.timeoutMs,
    peakMode: options?.peakMode ?? base.peakMode,
  };
}

function assertPeak(
  peak: FullPlayProvePeak,
  expectedPeak: number,
  peakMode: FullPlayProvePeakMode,
  allowLoginSkip: boolean
): string | null {
  if (peakMode === "login-skip-safe" && allowLoginSkip) {
    const reachedEnd = peak.visible >= peak.total && peak.total > 0;
    const peakOk = reachedEnd && peak.total >= expectedPeak - 1;
    if (!peakOk) {
      return (
        `peak-not-${expectedPeak}: got ${peak.visible}/${peak.total}` +
        (peak.counter ? ` (${peak.counter})` : "")
      );
    }
    return null;
  }
  if (peak.visible < expectedPeak || peak.total !== expectedPeak) {
    return (
      `peak-not-${expectedPeak}/${expectedPeak}: got ${peak.visible}/${peak.total}` +
      (peak.counter ? ` (${peak.counter})` : "")
    );
  }
  return null;
}

/**
 * Universal full continuous Play prove.
 *
 * Window: `__studioRunFullPlayProve` / `__protoRunFullPlayProve`.
 */
export async function runFullPlayProve(
  options?: FullPlayProveOptions
): Promise<FullPlayProveResult> {
  const preset = resolvePreset(options);
  const allowLoginSkip = options?.allowLoginSkipPeak !== false;
  const delay = options?.delay ?? delayMs;
  const errors: string[] = [];

  // 1) ALWAYS CLEAR prior QA (mandatory).
  forceClearAgentTestingOverlay();

  const prior = getMcpTestSession();
  if (prior) {
    requestMcpTestAbort("superseded");
    endMcpTestSession(prior.id);
  }
  const sessionId = beginMcpTestSession(preset.sessionName);
  enableCursorQaEyes();
  beginQaProveMode("full-play-prove");

  let smoke: PlayJourneySmokeResult | undefined;
  let leave: AgentLeavePauseResult | undefined;
  let peak: FullPlayProvePeak = {
    visible: 0,
    total: 0,
    counter: null,
  };
  let end: PlayEndAtStartAssertResult | null = null;

  try {
    // 2) Fresh QA arm — overlay usable; do NOT schedule ensure-clear teardown.
    startAgentTestingOverlay(preset.overlayTitle);
    await preArmAgentTestingOverlay({
      preArmMs: options?.preArmMs ?? DEFAULT_PREARM_MS,
      title: "AGENT TESTING — preparing…",
    });
    touchAgentTestingOverlay(preset.overlayTitle);
    logAgentTestingOverlay(
      `prove: full-play ${preset.journeyId} (keep overlay · prove-mode latch)`
    );

    // 3–5) Jump start + continuous Play + play-end assert (shared smoke core).
    smoke = await runPlayJourneyToStartSmoke({
      orchestraMode: preset.orchestraMode,
      startBeatId: preset.startBeatId,
      startScreenId: preset.startScreenId,
      timeoutMs: preset.timeoutMs,
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
      total: fromCounter.total || preset.expectedPeak,
      counter:
        smoke.peakCounter ??
        (smoke.peakVisible != null
          ? `${smoke.peakVisible} / ${fromCounter.total || preset.expectedPeak}`
          : null),
    };
    end = smoke.assert ?? null;

    if (!smoke.pass) {
      errors.push(smoke.reason ?? "play-smoke-failed");
    }
    const peakErr = assertPeak(
      peak,
      preset.expectedPeak,
      preset.peakMode,
      allowLoginSkip
    );
    if (peakErr) errors.push(peakErr);
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
        ? `prove PASS · ${preset.journeyId} · peak ${peak.visible}/${peak.total} · play-end at start`
        : `prove FAIL · ${preset.journeyId} · ${errors.join("; ")}`
    );

    return {
      pass,
      peak,
      end,
      errors,
      leave,
      smoke,
      journeyId: preset.journeyId,
      experience: preset.experience,
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    errors.push(`exception:${msg}`);
    try {
      leave = pauseForAgentLeave();
    } catch {
      /* hang-safe */
    }
    return {
      pass: false,
      peak,
      end,
      errors,
      leave,
      smoke,
      journeyId: preset.journeyId,
      experience: preset.experience,
    };
  } finally {
    // Keep overlay — no stop() / forceClear / ensure-clear (unlike withMcpTestSession).
    try {
      endQaProveMode();
    } catch {
      /* hang-safe */
    }
    try {
      disableCursorQaEyes();
    } catch {
      /* hang-safe */
    }
    endMcpTestSession(sessionId);
  }
}

/** Thin agentic preset — delegates to {@link runFullPlayProve}. */
export async function runAgenticFullPlayProve(
  options?: Omit<FullPlayProveOptions, "experience" | "journeyId"> & {
    experience?: never;
    journeyId?: never;
  }
): Promise<FullPlayProveResult> {
  return runFullPlayProve({ ...options, experience: "agentic" });
}

/** Thin traditional preset — delegates to {@link runFullPlayProve}. */
export async function runTraditionalFullPlayProve(
  options?: Omit<FullPlayProveOptions, "experience"> & {
    experience?: never;
  }
): Promise<FullPlayProveResult> {
  return runFullPlayProve({
    ...options,
    experience: "traditional",
    journeyId: options?.journeyId ?? "traditional-cjm",
  });
}

/** @deprecated Alias — use FullPlayProveResult */
export type AgenticFullPlayProveResult = FullPlayProveResult;
/** @deprecated Alias — use FullPlayProveOptions */
export type AgenticFullPlayProveOptions = FullPlayProveOptions;
/** @deprecated Alias — use FullPlayProvePeak */
export type AgenticFullPlayProvePeak = FullPlayProvePeak;
/** @deprecated Alias — use FullPlayProveResult */
export type TraditionalFullPlayProveResult = FullPlayProveResult;
/** @deprecated Alias — use FullPlayProveOptions */
export type TraditionalFullPlayProveOptions = FullPlayProveOptions;
/** @deprecated Alias — use FullPlayProvePeak */
export type TraditionalFullPlayProvePeak = FullPlayProvePeak;
