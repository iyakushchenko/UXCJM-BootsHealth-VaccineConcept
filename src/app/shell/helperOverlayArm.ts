/**
 * Auto-arm the AGENT TESTING overlay when mutating studio / legacy `__proto*`
 * helpers run. Read-only getters stay quiet. DevTools-only agents should call
 * `window.__studioAgentTestingOverlay.touch()` (or legacy `__proto*`) at session start.
 *
 * Public window API: prefer `__studio*` names; `__proto*` remain stable aliases
 * pointing at the **same** function/value.
 */

import { touchAgentTestingOverlay } from "@/app/shell/agentTestingOverlay";

const READ_ONLY_HELPER_SUFFIXES = new Set([
  "AgentTestingOverlay",
  "StudioState",
  "IsRecording",
  "GetRecording",
  "CursorDiagnostics",
  "McpEyes",
  "DiagnosticFlashes",
  "ControlPanelLog",
  "DismissPlaybackDiagnostic",
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
]);

const ARMED_FLAG = "__studioOverlayArmed";
const STUDIO_WINDOW_API = /^__(?:proto|studio)[A-Z]/;

function helperSuffix(key: string): string | null {
  if (key.startsWith("__studio")) return key.slice("__studio".length);
  if (key.startsWith("__proto")) return key.slice("__proto".length);
  return null;
}

function isReadOnlySuffix(suffix: string): boolean {
  return READ_ONLY_HELPER_SUFFIXES.has(suffix);
}

function wrapHelper(name: string, fn: (...args: unknown[]) => unknown) {
  if ((fn as { [ARMED_FLAG]?: boolean })[ARMED_FLAG]) return fn;
  const wrapped = (...args: unknown[]) => {
    touchAgentTestingOverlay(`AGENT TESTING — ${name}`);
    return fn(...args);
  };
  (wrapped as { [ARMED_FLAG]?: boolean })[ARMED_FLAG] = true;
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
    if (isReadOnlySuffix(suffix)) continue;
    const protoKey = `__proto${suffix}`;
    const studioKey = `__studio${suffix}`;
    const raw = w[protoKey] ?? w[studioKey];
    if (typeof raw !== "function") continue;
    const wrapped = wrapHelper(
      `__studio${suffix}`,
      raw as (...args: unknown[]) => unknown,
    );
    w[protoKey] = wrapped;
    w[studioKey] = wrapped;
  }

  // Non-functions (overlay object, getters installed as values) + any leftovers.
  mirrorStudioWindowApis();
}
