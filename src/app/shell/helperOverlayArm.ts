/**
 * Auto-arm the AGENT TESTING overlay when mutating studio / legacy `__proto*`
 * helpers run. Read-only getters stay quiet. DevTools-only agents should call
 * `window.__studioAgentTestingOverlay.touch()` (or legacy `__proto*`) at session start.
 *
 * Public window API: prefer `__studio*` names; `__proto*` remain stable aliases
 * pointing at the **same** function/value.
 *
 * Titles stay clean ("AGENT TESTING") — never concatenate raw helper names
 * (uppercase CSS turned `__studioEnsureCleanStudio` into garbled panel titles).
 */

import {
  logAgentTestingHelper,
  touchAgentTestingOverlay,
} from "@/app/shell/agent-testing/agentTestingOverlay";
import { getMcpTestSession } from "@/app/shell/mcpTestGuard";
import {
  isQuietHelperSuffix,
  MUST_STAY_QUIET_SUITE_HELPER_SUFFIXES,
  QA_SUITE_NO_TOUCH_WRAP_RULE_ID,
  QA_SUITE_TOUCH_WRAP_DIG,
} from "@/app/shell/qaSuiteTouchWrapContract";

export {
  QA_SUITE_NO_TOUCH_WRAP_RULE_ID,
  QA_SUITE_TOUCH_WRAP_DIG,
  MUST_STAY_QUIET_SUITE_HELPER_SUFFIXES,
  isQuietHelperSuffix,
};

const READ_ONLY_HELPER_SUFFIXES = new Set([
  "AgentTestingOverlay",
  "StudioState",
  "IsRecording",
  "IsLoggedIn",
  "GetRecording",
  "CursorDiagnostics",
  "McpEyes",
  "DiagnosticFlashes",
  "ControlPanelLog",
  "DismissPlaybackDiagnostic",
  // Pollable playback-diag peeks — agents tick these; MUST NOT log/re-arm every peek.
  "PeekPlaybackDiagnostic",
  "IsPlaybackDiagnosticOpen",
  "ConsumePlaybackDiagnostic",
  "ExportRecording",
  "ExportJourney",
  "ExportJourneyBundle",
  "CompileRecording",
  "CompileRecordingToJourney",
  "ListJourneys",
  "HasImportedJourneys",
  "ImportJourney",
  "ImportJourneyBundle",
  "QaHud",
  "SmokeRetreatChecks",
  // QA diag gate / free-form logger — read/status + open-logger; must NOT re-arm.
  "QaDiagGateOpen",
  "OpenQaLogger",
  "ToggleQaLogger",
  "QaHandoff",
  "AskUserInQa",
  "QaSessionKind",
  "McpConnectionStatus",
  "ReportMcpConnectionError",
  "AppendPoNote",
  "DownloadAgentTestingDump",
  // FAIL handoff / freeze / RTT — MUST NOT touch-wrap (touch would confirm+clear freeze).
  "IsQaProgressFrozen",
  "BeginQaFailHandoff",
  "ConfirmFailTakeover",
  "QaMessageRttStats",
  "BenchmarkQaMessageRtt",
  "ConsumePoSignal",
  "PeekPoSignal",
  "AgentTestingTakeover",
  // Cleanup / abort manage overlay themselves — do not re-arm mid-reset.
  "EnsureCleanStudio",
  "AbortAll",
  "StopAllPlayback",
  "HaltPlaybackForPoSignal",
  "ForceClearAgentTestingOverlay",
  "SoftCloseQaLogger",
  // Autonomous QA suite + runners — also gated by isQuietHelperSuffix (R16).
  ...MUST_STAY_QUIET_SUITE_HELPER_SUFFIXES,
  // Chat bubble self-test owns Observe/agent open.
  "RunChatBubbleMotionSelfTest",
  // Full Play prove — owns forceClear/arm/leave; must not double-touch wrap.
  "RunFullPlayProve",
  "RunAgenticFullPlayProve",
  "RunTraditionalFullPlayProve",
  // REC arm / assert / new-CJM prove — own QA rows; no double-touch spam.
  "ArmRecCapture",
  "AssertRecLive",
  "RunRecNewCjmProve",
  "RecNewCjmCapturePath",
  "RecNewCjmCaptureClick",
  "RecModalOpen",
  "RecModalPharmacyPick",
  "RecModalPick",
  "RecStartScreenSeed",
  "QaModalOpen",
  "QaModalClose",
  "QaModalPick",
  "RequireFreshQaSession",
  // Auto-Rule agent-teardown-clean asserts — must not re-arm overlay while proving clear.
  "AssertAgentTeardownClean",
  "WaitAgentTeardownClean",
]);

/**
 * Product REC helpers — log + soft-arm, but never wipe observe/manual → agent.
 * Dual-use: OBSERVE/MANUAL capture while recording a real CJM.
 */
const PRESERVE_LOGGER_HELPER_SUFFIXES = new Set([
  "StartRecording",
  "StopRecording",
  "PauseRecording",
  "ResumeRecording",
  "SaveRecordingAsJourney",
  "ClearRecording",
  // Autonomous QA-suite self-tests run from a PO-owned Manual/Observe popup
  // (Run CTA) — they own their own kind-aware start/touch internally; the
  // generic wrap must not force-connect Observe into agent lock underneath
  // them (2026-07-23 self-test dead-end/kind-hijack bug).
  "RunMcpSanityCheck",
  "RunMcpPageProbe",
]);

/**
 * These helpers log their own honest QA rows (REC live / Add CJM).
 * Skip the generic helper:StartRecording spam that looked like REC
 * when agents only armed chrome or played a journey.
 */
const SELF_LOGGED_HELPER_SUFFIXES = new Set([
  "StartRecording",
  "StopRecording",
  "SaveRecordingAsJourney",
  "ArmRecCapture",
  "RunRecNewCjmProve",
]);

const ARMED_FLAG = "__studioOverlayArmed";
const INNER_FN = "__studioOverlayInner";
const STUDIO_WINDOW_API = /^__(?:proto|studio)[A-Z]/;

type ArmedFn = ((...args: unknown[]) => unknown) & {
  [ARMED_FLAG]?: boolean;
  [INNER_FN]?: (...args: unknown[]) => unknown;
};

function helperSuffix(key: string): string | null {
  if (key.startsWith("__studio")) return key.slice("__studio".length);
  if (key.startsWith("__proto")) return key.slice("__proto".length);
  return null;
}

function isReadOnlySuffix(suffix: string): boolean {
  // Explicit list OR R16 quiet patterns (future *QaSuite* / status polls).
  return READ_ONLY_HELPER_SUFFIXES.has(suffix) || isQuietHelperSuffix(suffix);
}

/** Prefer the pre-wrap implementation when a helper was reclassified read-only. */
function unwrapHelper(fn: (...args: unknown[]) => unknown): (...args: unknown[]) => unknown {
  const armed = fn as ArmedFn;
  return armed[ARMED_FLAG] && typeof armed[INNER_FN] === "function"
    ? armed[INNER_FN]!
    : fn;
}

function wrapHelper(suffix: string, fn: (...args: unknown[]) => unknown) {
  const inner = unwrapHelper(fn);
  if (isReadOnlySuffix(suffix)) return inner;
  if ((fn as ArmedFn)[ARMED_FLAG] && (fn as ArmedFn)[INNER_FN] === inner) {
    return fn;
  }
  const wrapped: ArmedFn = (...args: unknown[]) => {
    // Autonomous QA already owns an active session. Re-touching its own
    // window helpers can confirm a just-raised handoff and pause the runner.
    // Manual agent calls still arm/touch exactly as before.
    if (!getMcpTestSession()) {
      touchAgentTestingOverlay(
        undefined,
        PRESERVE_LOGGER_HELPER_SUFFIXES.has(suffix)
          ? { preserveLogger: true }
          : undefined
      );
    }
    try {
      if (!SELF_LOGGED_HELPER_SUFFIXES.has(suffix)) {
        logAgentTestingHelper(suffix);
      }
    } catch {
      /* ignore */
    }
    return inner(...args);
  };
  wrapped[ARMED_FLAG] = true;
  wrapped[INNER_FN] = inner;
  return wrapped;
}

function collectApiSuffixes(): string[] {
  const suffixes = new Set<string>();
  for (const key of Object.getOwnPropertyNames(window)) {
    if (!STUDIO_WINDOW_API.test(key)) continue;
    const suffix = helperSuffix(key);
    if (suffix) suffixes.add(suffix);
  }
  return [...suffixes];
}

/**
 * Force every `__protoX` / `__studioX` pair to share one value.
 * Prefer an already-armed function when present.
 */
export function mirrorStudioWindowApis(): void {
  if (typeof window === "undefined") return;
  const w = window as unknown as Record<string, unknown>;

  for (const suffix of collectApiSuffixes()) {
    const protoKey = `__proto${suffix}`;
    const studioKey = `__studio${suffix}`;
    const protoVal = w[protoKey];
    const studioVal = w[studioKey];
    let preferred: unknown = null;
    if (
      typeof protoVal === "function" &&
      (protoVal as { [ARMED_FLAG]?: boolean })[ARMED_FLAG]
    ) {
      preferred = protoVal;
    } else if (
      typeof studioVal === "function" &&
      (studioVal as { [ARMED_FLAG]?: boolean })[ARMED_FLAG]
    ) {
      preferred = studioVal;
    } else {
      preferred = protoVal ?? studioVal;
    }
    if (preferred == null) continue;
    w[protoKey] = preferred;
    w[studioKey] = preferred;
  }
}

/** Wrap mutating helpers once, then dual-bind `__studio*` ↔ `__proto*`. */
export function armOverlayOnStudioHelpers(): void {
  if (typeof window === "undefined") return;
  const w = window as unknown as Record<string, unknown>;

  for (const suffix of collectApiSuffixes()) {
    const protoKey = `__proto${suffix}`;
    const studioKey = `__studio${suffix}`;
    const raw = w[protoKey] ?? w[studioKey];
    if (typeof raw !== "function") continue;
    // Read-only (incl. reclassified suite status polls): unwrap any stale touch-wrap.
    const next = wrapHelper(suffix, raw as (...args: unknown[]) => unknown);
    w[protoKey] = next;
    w[studioKey] = next;
  }

  // Non-functions (overlay object, getters installed as values) + any leftovers.
  mirrorStudioWindowApis();
}
