/**
 * @vitest-environment happy-dom
 *
 * Bug (2026-07-23): running the "QA tool health" self-test (mcp-sanity)
 * from an already-open Manual QA popup silently hijacked the session into
 * AGENT kind — Take control appeared, the panel settled into a "SESSION
 * FINALE" dead end, and Save Log dumps showed sessionKind:"agent" even
 * though the PO launched Manual QA. Root cause: `__protoAbortAll` force-
 * stopped (teardown + active=false) any live overlay, and
 * `startAgentTestingOverlay` unconditionally set kind to "agent" on the
 * fresh re-arm that followed — regardless of what a PO already owned.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/app/scenario/demoCursor", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/app/scenario/demoCursor")>();
  return {
    ...actual,
    removeDemoCursor: vi.fn(),
    cancelDemoCursorTravel: vi.fn(),
  };
});

vi.mock("@/app/scenario/playbackScroll", () => ({
  cancelPlaybackScroll: vi.fn(),
}));

import {
  forceClearAgentTestingOverlay,
  getSessionKind,
  installAgentTestingOverlayApi,
  openAgentTestingLogger,
  uninstallAgentTestingOverlayApi,
} from "@/app/shell/agent-testing";
import { resetQaSessionForTests } from "@/app/shell/agent-testing/agentTestingSession";
import { registerStudioMcpHelpers } from "@/app/shell/studioMcpHelpers";

function baseGetState() {
  return {
    journeyMode: false,
    scrollLock: false,
    label: null,
    counter: null,
    beatId: null,
    availStep: null,
  };
}

describe("QA self-test must not hijack a PO-owned Manual/Observe session", () => {
  let cleanupHelpers: (() => void) | undefined;

  beforeEach(() => {
    resetQaSessionForTests();
    installAgentTestingOverlayApi();
    cleanupHelpers = registerStudioMcpHelpers({
      dismissDiagnostic: () => {},
      isDiagnosticOpen: () => false,
      getState: baseGetState,
    });
  });

  afterEach(() => {
    cleanupHelpers?.();
    forceClearAgentTestingOverlay();
    uninstallAgentTestingOverlayApi();
    resetQaSessionForTests();
  });

  it("stays Manual QA (not agent) after running mcp-sanity from a Manual popup", async () => {
    openAgentTestingLogger({ kind: "manual" });
    expect(getSessionKind()).toBe("manual");

    await window.__protoRunMcpSanityCheck?.();

    expect(getSessionKind()).toBe("manual");
    const panel = document.querySelector(".studio-agent-testing-overlay");
    expect(panel).not.toBeNull();
    const title = panel?.querySelector(
      ".studio-agent-testing-overlay__title, [data-studio-overlay-title]"
    );
    expect(title?.textContent ?? "").not.toContain("AGENT TESTING");
    const takeControl = panel?.querySelector<HTMLElement>(
      ".studio-agent-testing-overlay__take-control"
    );
    expect(takeControl == null || takeControl.hidden).toBe(true);
  });

  it("abortAll never force-clears a live Manual session", async () => {
    openAgentTestingLogger({ kind: "manual" });
    window.__protoAbortAll?.();

    expect(getSessionKind()).toBe("manual");
    expect(document.querySelector(".studio-agent-testing-overlay")).not.toBeNull();
  });

  it("cold-starts fresh AGENT kind when no session is open at all", async () => {
    expect(document.querySelector(".studio-agent-testing-overlay")).toBeNull();

    await window.__protoRunMcpSanityCheck?.();

    // Standalone MCP-driven run (no PO popup already open) legitimately
    // owns/settles its own agent-kind session.
    expect(getSessionKind()).toBe("agent");
  });
});
