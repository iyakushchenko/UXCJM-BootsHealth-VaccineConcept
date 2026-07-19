/**
 * Auto-arm the AGENT TESTING overlay when mutating `__proto*` helpers run.
 * Read-only getters stay quiet. DevTools-only agents should call
 * `window.__protoAgentTestingOverlay.touch()` at session start.
 */

import { touchAgentTestingOverlay } from "@/app/shell/protoAgentTestingOverlay";

const READ_ONLY_PROTO_HELPERS = new Set([
  "__protoAgentTestingOverlay",
  "__protoStudioState",
  "__protoIsRecording",
  "__protoGetRecording",
  "__protoCursorDiagnostics",
  "__protoMcpEyes",
  "__protoDiagnosticFlashes",
  "__protoControlPanelLog",
  "__protoDismissPlaybackDiagnostic",
  "__protoExportRecording",
  "__protoExportJourney",
  "__protoExportJourneyBundle",
  "__protoCompileRecording",
  "__protoListJourneys",
  "__protoHasImportedJourneys",
  "__protoImportJourney",
  "__protoImportJourneyBundle",
  "__protoQaHud",
  "__protoSmokeRetreatChecks",
]);

const ARMED_FLAG = "__protoOverlayArmed";

function wrapHelper(name: string, fn: (...args: unknown[]) => unknown) {
  if ((fn as { [ARMED_FLAG]?: boolean })[ARMED_FLAG]) return fn;
  const wrapped = (...args: unknown[]) => {
    touchAgentTestingOverlay(`AGENT TESTING — ${name}`);
    return fn(...args);
  };
  (wrapped as { [ARMED_FLAG]?: boolean })[ARMED_FLAG] = true;
  return wrapped;
}

/** Wrap current `window.__proto*` function helpers (idempotent). */
export function armOverlayOnProtoHelpers(): void {
  if (typeof window === "undefined") return;

  for (const key of Object.getOwnPropertyNames(window)) {
    if (!key.startsWith("__proto")) continue;
    if (READ_ONLY_PROTO_HELPERS.has(key)) continue;
    const value = (window as unknown as Record<string, unknown>)[key];
    if (typeof value !== "function") continue;
    (window as unknown as Record<string, unknown>)[key] = wrapHelper(
      key,
      value as (...args: unknown[]) => unknown
    );
  }
}
