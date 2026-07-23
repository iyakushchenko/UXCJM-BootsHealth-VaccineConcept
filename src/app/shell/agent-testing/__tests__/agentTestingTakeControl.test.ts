/**
 * @vitest-environment happy-dom
 *
 * "Take control" header link — hidden in manual, visible+enabled in agent/observe
 * when idle, disabled while a suite is running, click reclaims to manual.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/app/scenario/demoCursor", () => ({
  removeDemoCursor: vi.fn(),
  cancelDemoCursorTravel: vi.fn(),
}));

vi.mock("@/app/scenario/playbackScroll", () => ({
  cancelPlaybackScroll: vi.fn(),
}));

let suitePhase: "idle" | "running" = "idle";

vi.mock("@/app/shell/qaAutonomousSuite", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/app/shell/qaAutonomousSuite")>();
  return {
    ...actual,
    getAutonomousQaSuiteStatus: () => ({
      ...actual.getAutonomousQaSuiteStatus(),
      phase: suitePhase,
    }),
  };
});

import {
  forceClearAgentTestingOverlay,
  getSessionKind,
  handoffQaSession,
  installAgentTestingOverlayApi,
  openAgentTestingLogger,
  takeControlSession,
  uninstallAgentTestingOverlayApi,
} from "@/app/shell/agent-testing";
import { resetQaSessionForTests } from "@/app/shell/agent-testing/agentTestingSession";

function takeControlBtn(): HTMLButtonElement | null {
  return document.querySelector<HTMLButtonElement>(
    ".studio-agent-testing-overlay__take-control"
  );
}

describe("agentTesting Take control link", () => {
  beforeEach(() => {
    suitePhase = "idle";
    resetQaSessionForTests();
    installAgentTestingOverlayApi();
    window.history.replaceState(
      null,
      "",
      "/?project=boots-pharmacy&screen=book-step-1"
    );
  });

  afterEach(() => {
    forceClearAgentTestingOverlay();
    uninstallAgentTestingOverlayApi();
    vi.useRealTimers();
  });

  it("is hidden when sessionKind is manual", () => {
    openAgentTestingLogger("manual-check");
    expect(getSessionKind()).toBe("manual");
    const btn = takeControlBtn();
    expect(btn).toBeTruthy();
    expect(btn?.hidden).toBe(true);
  });

  it("is visible + enabled when sessionKind is agent and nothing is running", () => {
    handoffQaSession({ oversee: true, kind: "agent" });
    expect(getSessionKind()).toBe("agent");
    const btn = takeControlBtn();
    expect(btn?.hidden).toBe(false);
    expect(btn?.disabled).toBe(false);
  });

  it("is visible + disabled when sessionKind is agent and a suite is running", () => {
    handoffQaSession({ oversee: true, kind: "agent" });
    suitePhase = "running";
    // Re-sync chrome by handing off again with same kind (no-op transition) —
    // touch overlay to trigger a fresh syncSessionChrome pass.
    handoffQaSession({ oversee: true, kind: "agent" });
    const btn = takeControlBtn();
    expect(btn?.hidden).toBe(false);
    expect(btn?.disabled).toBe(true);
    expect(btn?.title).toMatch(/unavailable while a test is running/i);
  });

  it("is visible + enabled for observe kind when idle", () => {
    handoffQaSession({ oversee: true, kind: "observe" });
    expect(getSessionKind()).toBe("observe");
    const btn = takeControlBtn();
    expect(btn?.hidden).toBe(false);
    expect(btn?.disabled).toBe(false);
  });

  it("clicking (when enabled) switches sessionKind to manual", () => {
    handoffQaSession({ oversee: true, kind: "agent" });
    expect(getSessionKind()).toBe("agent");
    const btn = takeControlBtn();
    expect(btn?.disabled).toBe(false);
    btn?.click();
    expect(getSessionKind()).toBe("manual");
    expect(takeControlBtn()?.hidden).toBe(true);
  });

  it("takeControlSession no-ops when already manual", () => {
    openAgentTestingLogger("already-manual");
    expect(getSessionKind()).toBe("manual");
    expect(takeControlSession("test")).toBe(false);
    expect(getSessionKind()).toBe("manual");
  });
});
