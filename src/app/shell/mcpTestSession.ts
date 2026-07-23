/**
 * Shared MCP test session wrapper — overlay + cursor eyes + abort guard.
 */

import {
  DEFAULT_PREARM_MS,
  DEFAULT_SETTLE_MS,
  forceClearAgentTestingOverlay,
  isAgentTestingOverlayActive,
  logAgentTestingOverlay,
  preArmAgentTestingOverlay,
  scheduleAgentTestingOverlayEnsureClear,
  startAgentTestingOverlay,
  stopAgentTestingOverlay,
  touchAgentTestingOverlay,
} from "@/app/shell/agent-testing/agentTestingOverlay";
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
import { resetStudioAfterAgentTest } from "@/app/shell/studioUrl";

export function mcpDelay(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

export type McpTestSessionOptions = {
  /**
   * Journey smoke teardown → key 1 (`site-pilot` / `plp`), never hub.
   * Preferred for CJM / Play / step-forward / retreat smokes.
   */
  resetToJourneyStart?: boolean;
  /**
   * @deprecated Forbidden for product/smoke — Hub nav click only.
   */
  resetToHub?: boolean;
  preArmMs?: number;
  settleMs?: number;
  result?: "pass" | "fail" | "neutral";
  /** Default true for journey/CJM sessions. Pass false to skip reload. */
  reload?: boolean;
};

export async function withMcpTestSession<T>(
  label: string,
  run: () => Promise<T>,
  sessionOptions?: McpTestSessionOptions
): Promise<T> {
  const prior = getMcpTestSession();
  if (prior) {
    requestMcpTestAbort("superseded");
    endMcpTestSession(prior.id);
  }
  const id = beginMcpTestSession(label);
  enableCursorQaEyes();
  const settleMs = sessionOptions?.settleMs ?? DEFAULT_SETTLE_MS;
  let sessionResult: "pass" | "fail" | "neutral" =
    sessionOptions?.result ?? "neutral";
  // Journey smokes: key 1, never hub (PO rage — Alarm abort / smoke end).
  const resetToJourneyStart = sessionOptions?.resetToJourneyStart === true;
  const resetToHub =
    !resetToJourneyStart && sessionOptions?.resetToHub === true;
  // A PO-owned Manual/Observe QA session already open must not be silently
  // force-cleared + hijacked into AGENT TESTING kind by an internal suite
  // test (2026-07-23 self-test kind-hijack bug class — this is the SHARED
  // wrapper behind play/prove/validate/map-interactions, so every suite
  // test besides mcp-sanity/page-probe ran through this same bug). Only
  // cold-start a fresh AGENT session when nothing owns the panel yet;
  // otherwise nest into whichever session already owns it — never wipe it.
  const ownedByOtherSession = isAgentTestingOverlayActive();
  if (ownedByOtherSession) {
    touchAgentTestingOverlay("AGENT TESTING — preparing…", { preserveLogger: true });
  } else {
    // HARD — always wipe prior QA before a new smoke/prove session.
    // forceClear also ends prove-mode — re-arm below so step-forward / retreat /
    // play smokes survive long type-in (>8s) without agent-stale abort.
    forceClearAgentTestingOverlay();
    startAgentTestingOverlay("AGENT TESTING — preparing…");
  }
  try {
    await preArmAgentTestingOverlay({
      preArmMs: sessionOptions?.preArmMs ?? DEFAULT_PREARM_MS,
      title: "AGENT TESTING — preparing…",
    });
    touchAgentTestingOverlay(`AGENT TESTING — ${label}`, { preserveLogger: true });
    beginQaProveMode(`mcp-test-session:${label}`);
    logAgentTestingOverlay(`session: ${label}`);
    const out = await run();
    if (sessionOptions?.result == null) {
      // Best-effort: if run returns { pass: boolean }, stamp sitrep.
      if (
        out &&
        typeof out === "object" &&
        "pass" in out &&
        typeof (out as { pass: unknown }).pass === "boolean"
      ) {
        sessionResult = (out as { pass: boolean }).pass ? "pass" : "fail";
      }
    }
    return out;
  } finally {
    try {
      endQaProveMode();
    } catch {
      /* hang-safe */
    }
    // Nested into a PO-owned session we did not start — never settle/Finale
    // it just because this internal test finished; the outer suite runner
    // (or the PO) owns that session's lifecycle (2026-07-23 kind-hijack bug).
    if (!ownedByOtherSession) {
      try {
        stopAgentTestingOverlay({
          reload: sessionOptions?.reload !== false,
          resetToJourneyStart,
          resetToHub,
          settleMs,
          result: sessionResult,
        });
      } catch {
        forceClearAgentTestingOverlay();
      }
      scheduleAgentTestingOverlayEnsureClear(settleMs + 1000);
    }
    try {
      resetStudioAfterAgentTest({
        resetToJourneyStart,
        resetToHub,
      });
    } catch {
      /* never leave sticky &modal= after session end */
    }
    disableCursorQaEyes();
    endMcpTestSession(id);
  }
}
