/**
 * @vitest-environment happy-dom
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/app/scenario/demoCursor", () => ({
  removeDemoCursor: vi.fn(),
  cancelDemoCursorTravel: vi.fn(),
}));

vi.mock("@/app/scenario/playbackScroll", () => ({
  cancelPlaybackScroll: vi.fn(),
}));

vi.mock("@/app/shell/playJourneySmoke", () => ({
  runPlayJourneyToStartSmoke: vi.fn(),
}));

import { runPlayJourneyToStartSmoke } from "@/app/shell/playJourneySmoke";
import {
  AGENTIC_FULL_PLAY_EXPECTED_PEAK,
  runAgenticFullPlayProve,
} from "@/app/shell/agenticFullPlayProve";
import {
  forceClearAgentTestingOverlay,
  installAgentTestingOverlayApi,
  isAgentTestingOverlayActive,
  isAgentTestingOverlayDomPresent,
  uninstallAgentTestingOverlayApi,
} from "@/app/shell/agent-testing";

describe("runAgenticFullPlayProve", () => {
  beforeEach(() => {
    installAgentTestingOverlayApi();
    window.history.replaceState(
      null,
      "",
      "/?project=boots-pharmacy&screen=site-pilot&cjm=on&experience=agentic"
    );
    (window as Window & { __protoEnsureCleanStudio?: () => void }).__protoEnsureCleanStudio =
      vi.fn();
    (window as Window & { __protoSetOrchestraMode?: (m: string) => void }).__protoSetOrchestraMode =
      vi.fn();
    (window as Window & { __protoSetJourneyMode?: (on: boolean) => boolean }).__protoSetJourneyMode =
      () => true;
    (window as Window & { __protoTriggerTransport?: (a: string) => boolean }).__protoTriggerTransport =
      () => true;
    (window as Window & { __protoStudioState?: () => unknown }).__protoStudioState = () => ({
      beatId: "agentic-home",
      counter: "1 / 21",
      isPlaying: false,
      isOnAir: false,
    });
  });

  afterEach(() => {
    forceClearAgentTestingOverlay();
    uninstallAgentTestingOverlayApi();
    vi.mocked(runPlayJourneyToStartSmoke).mockReset();
  });

  it("PASS when smoke peak 21/21 + play-end assert; keeps overlay; pauses leave", async () => {
    vi.mocked(runPlayJourneyToStartSmoke).mockResolvedValue({
      pass: true,
      peakVisible: 21,
      peakCounter: "STEPS: 21 / 21",
      assert: {
        pass: true,
        beatId: "agentic-home",
        screenId: "site-pilot",
      },
    });

    const result = await runAgenticFullPlayProve({
      delay: async () => undefined,
      timeoutMs: 1_000,
      preArmMs: 0,
    });

    expect(result.pass).toBe(true);
    expect(result.errors).toEqual([]);
    expect(result.peak).toMatchObject({
      visible: 21,
      total: 21,
    });
    expect(result.end?.pass).toBe(true);
    expect(result.leave?.ok).toBe(true);
    expect(result.leave?.capturePaused).toBe(true);
    expect(isAgentTestingOverlayActive()).toBe(true);
    expect(isAgentTestingOverlayDomPresent()).toBe(true);
    expect(AGENTIC_FULL_PLAY_EXPECTED_PEAK).toBe(21);
  });

  it("FAIL honestly when peak short of 21/21 — no invent green", async () => {
    vi.mocked(runPlayJourneyToStartSmoke).mockResolvedValue({
      pass: true,
      peakVisible: 12,
      peakCounter: "STEPS: 12 / 21",
      assert: {
        pass: true,
        beatId: "agentic-home",
        screenId: "site-pilot",
      },
    });

    const result = await runAgenticFullPlayProve({
      delay: async () => undefined,
      preArmMs: 0,
    });

    expect(result.pass).toBe(false);
    expect(result.errors.some((e) => e.startsWith("peak-not-21/21"))).toBe(
      true
    );
    expect(isAgentTestingOverlayActive()).toBe(true);
  });

  it("FAIL when smoke fails — surfaces reason in errors", async () => {
    vi.mocked(runPlayJourneyToStartSmoke).mockResolvedValue({
      pass: false,
      reason: "playback-diagnostic",
      peakVisible: 8,
      peakCounter: "STEPS: 8 / 21",
      assert: { pass: false, reason: "not-at-start" },
    });

    const result = await runAgenticFullPlayProve({
      delay: async () => undefined,
      preArmMs: 0,
    });

    expect(result.pass).toBe(false);
    expect(result.errors).toContain("playback-diagnostic");
    expect(result.errors.some((e) => e.includes("not-at-start") || e.includes("play-end"))).toBe(
      true
    );
  });
});
