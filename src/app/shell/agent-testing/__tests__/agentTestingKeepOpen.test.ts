/**
 * @vitest-environment happy-dom
 *
 * Keep open on AGENT DONE sitrep: Wrapping up… → Complete (PASS/FAIL).
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/app/scenario/demoCursor", () => ({
  removeDemoCursor: vi.fn(),
  cancelDemoCursorTravel: vi.fn(),
}));

vi.mock("@/app/scenario/playbackScroll", () => ({
  cancelPlaybackScroll: vi.fn(),
}));

import {
  forceClearAgentTestingOverlay,
  holdSettleOpen,
  installAgentTestingOverlayApi,
  isAgentTestingOverlaySettling,
  openAgentTestingLogger,
  startAgentTestingOverlay,
  stopAgentTestingOverlay,
  uninstallAgentTestingOverlayApi,
} from "@/app/shell/agent-testing";

function activityLabel(): string {
  const el = document.querySelector(".studio-agent-testing-overlay__activity");
  const label = el?.querySelector(".studio-agent-testing-overlay__activity-label");
  return label?.textContent ?? el?.textContent ?? "";
}

describe("agentTesting Keep open → Complete", () => {
  beforeEach(() => {
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

  it("Keep open changes status from Wrapping up… to Complete — PASS", () => {
    startAgentTestingOverlay("keep-open");
    stopAgentTestingOverlay({ result: "pass" });
    expect(isAgentTestingOverlaySettling()).toBe(true);
    expect(activityLabel()).toBe("Wrapping up…");

    expect(holdSettleOpen("test")).toBe(true);
    expect(isAgentTestingOverlaySettling()).toBe(true);
    expect(activityLabel()).toBe("Complete — PASS");

    const saveBtn = document.querySelector<HTMLButtonElement>(
      ".studio-agent-testing-overlay__dump"
    );
    expect(saveBtn).toBeTruthy();
    expect(saveBtn?.disabled).toBe(false);
  });

  it("Keep open with neutral result shows Complete", () => {
    startAgentTestingOverlay("keep-open-neutral");
    stopAgentTestingOverlay();
    expect(activityLabel()).toBe("Wrapping up…");
    expect(holdSettleOpen("test")).toBe(true);
    expect(activityLabel()).toBe("Complete");
  });

  it("Keep open with fail result shows Complete — FAIL", () => {
    startAgentTestingOverlay("keep-open-fail");
    stopAgentTestingOverlay({ result: "fail" });
    expect(activityLabel()).toBe("Wrapping up…");
    expect(holdSettleOpen("test")).toBe(true);
    expect(activityLabel()).toBe("Complete — FAIL");
  });

  it("Reset re-paints the title after a held sitrep — not a dead end (2026-07-23)", () => {
    openAgentTestingLogger({ kind: "manual" });
    stopAgentTestingOverlay({ result: "pass" });
    expect(holdSettleOpen("test")).toBe(true);

    const title = () =>
      document.querySelector(".studio-agent-testing-overlay__title")?.textContent ?? "";
    expect(title()).toContain("AGENT DONE");

    const resetBtn = document.querySelector<HTMLButtonElement>(
      ".studio-agent-testing-overlay__reset"
    );
    // Held Finale must stay Reset-able — it was a disabled dead-end no-op.
    expect(resetBtn?.disabled).toBe(false);
    resetBtn?.click();

    expect(title()).not.toContain("AGENT DONE");
    expect(title()).toContain("Manual QA");
    expect(isAgentTestingOverlaySettling()).toBe(false);
    expect(activityLabel()).toBe("Ready");
  });

  it("Reset re-paints the title after appendFinale on a still-fully-active session — the real self-test-run path (2026-07-23)", () => {
    openAgentTestingLogger({ kind: "manual" });
    window.__studioAgentTestingOverlay?.log("sanity: start");
    window.__studioAgentTestingOverlay?.log("sanity: check A");
    // This is what every autonomous suite run calls at completion
    // (qaAutonomousSuite.ts) — even from a fully-active Manual/Observe
    // session, not just a settled/held sitrep. It stamps the title
    // directly, bypassing sessionTitle/paintSessionKindTitle.
    window.__studioAgentTestingOverlay?.appendFinale("pass", "1/1 passed");

    const title = () =>
      document.querySelector(".studio-agent-testing-overlay__title")?.textContent ?? "";
    expect(title()).toContain("session finale");

    const resetBtn = document.querySelector<HTMLButtonElement>(
      ".studio-agent-testing-overlay__reset"
    );
    expect(resetBtn?.disabled).toBe(false);
    resetBtn?.click();

    expect(title()).not.toContain("session finale");
    expect(title()).toContain("Manual QA");
  });
});
