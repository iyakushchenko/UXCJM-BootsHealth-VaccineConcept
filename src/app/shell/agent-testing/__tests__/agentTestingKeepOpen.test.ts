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
  startAgentTestingOverlay,
  stopAgentTestingOverlay,
  uninstallAgentTestingOverlayApi,
} from "@/app/shell/agent-testing";

function activityLabel(): string {
  return (
    document.querySelector(".studio-agent-testing-overlay__activity")
      ?.textContent ?? ""
  );
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
});
