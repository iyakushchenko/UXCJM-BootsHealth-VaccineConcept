/**
 * @vitest-environment happy-dom
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/app/scenario/demoCursor", () => ({
  removeDemoCursor: vi.fn(),
  cancelDemoCursorTravel: vi.fn(),
  parkDemoCursorForTypeIn: vi.fn(),
  readDemoCursorDomState: () => ({
    visible: true,
    missing: false,
    parked: true,
    opacity: "1",
    display: "block",
  }),
  clearDemoCursorCarriageLatches: vi.fn(),
}));

vi.mock("@/app/scenario/playbackScroll", () => ({
  cancelPlaybackScroll: vi.fn(),
}));

vi.mock("@/app/shell/studioUrl", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/app/shell/studioUrl")>();
  return {
    ...actual,
    resetStudioAfterAgentTest: vi.fn(),
  };
});

import {
  forceClearAgentTestingOverlay,
  getSessionKind,
  installAgentTestingOverlayApi,
  openAgentTestingLogger,
  uninstallAgentTestingOverlayApi,
} from "@/app/shell/agent-testing";
import { isQaProveModeActive } from "@/app/shell/agent-testing/agentTestingPresence";
import { withMcpTestSession } from "@/app/shell/mcpTestSession";

describe("withMcpTestSession prove-mode", () => {
  beforeEach(() => {
    installAgentTestingOverlayApi();
    forceClearAgentTestingOverlay();
    window.history.replaceState(
      null,
      "",
      "/?project=boots-pharmacy&screen=site-pilot&cjm=on&experience=agentic"
    );
  });

  afterEach(() => {
    forceClearAgentTestingOverlay();
    uninstallAgentTestingOverlayApi();
  });

  it("arms prove-mode for the session body and clears it in finally", async () => {
    let sawProveMode = false;
    const out = await withMcpTestSession(
      "agentic-step-forward",
      async () => {
        sawProveMode = isQaProveModeActive();
        return { pass: true };
      },
      { resetToJourneyStart: true, reload: false, preArmMs: 0, settleMs: 0 }
    );
    expect(out).toEqual({ pass: true });
    expect(sawProveMode).toBe(true);
    expect(isQaProveModeActive()).toBe(false);
  });
});

describe("withMcpTestSession must not hijack a PO-owned Manual/Observe session", () => {
  // Bug (2026-07-23): every suite self-test besides mcp-sanity/page-probe
  // (retreat-smoke, step-forward smokes, traditional/agentic play smokes,
  // control-room robot QA) runs through this shared wrapper, which used to
  // unconditionally forceClear + startAgentTestingOverlay — silently wiping
  // and re-stamping AGENT kind over a PO's already-open Manual QA session.
  beforeEach(() => {
    installAgentTestingOverlayApi();
    forceClearAgentTestingOverlay();
    window.history.replaceState(
      null,
      "",
      "/?project=boots-pharmacy&screen=site-pilot&cjm=on&experience=agentic"
    );
  });

  afterEach(() => {
    forceClearAgentTestingOverlay();
    uninstallAgentTestingOverlayApi();
  });

  it("stays Manual QA (not agent) when a smoke test runs from an open Manual popup", async () => {
    openAgentTestingLogger({ kind: "manual" });
    expect(getSessionKind()).toBe("manual");

    const out = await withMcpTestSession(
      "traditional-step-forward",
      async () => ({ pass: true }),
      { resetToJourneyStart: true, reload: false, preArmMs: 0, settleMs: 0 }
    );

    expect(out).toEqual({ pass: true });
    expect(getSessionKind()).toBe("manual");
    expect(document.querySelector(".studio-agent-testing-overlay")).not.toBeNull();
  });

  it("cold-starts fresh AGENT kind when no session is open at all", async () => {
    expect(document.querySelector(".studio-agent-testing-overlay")).toBeNull();

    const out = await withMcpTestSession(
      "traditional-step-forward",
      async () => ({ pass: true }),
      { resetToJourneyStart: true, reload: false, preArmMs: 0, settleMs: 0 }
    );

    expect(out).toEqual({ pass: true });
    // Standalone MCP-driven run (no PO popup already open) legitimately
    // owns/settles its own agent-kind session.
    expect(getSessionKind()).toBe("agent");
  });
});
