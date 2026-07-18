import { describe, expect, it } from "vitest";
import {
  resolveBrowseScenarioVisibleCount,
  resolveInitialScenarioVisibleCount,
  resolveScenarioEndVisibleCount,
  scenarioTotalFor,
} from "@/app/nav/useProtoScenarioPlayback";

describe("scenario playback counts", () => {
  it("adds one virtual finale frame when onFinale is configured", () => {
    expect(scenarioTotalFor(8, true)).toBe(9);
    expect(scenarioTotalFor(8, false)).toBe(8);
  });

  it("starts chat scenarios at min visible frames, not full disclosure", () => {
    expect(resolveInitialScenarioVisibleCount(8, true, 1)).toBe(1);
    expect(resolveInitialScenarioVisibleCount(0, true, 1)).toBe(0);
  });

  it("restores full content end on CJM step-back re-init", () => {
    expect(resolveScenarioEndVisibleCount(8, true)).toBe(8);
    expect(resolveScenarioEndVisibleCount(8, false)).toBe(8);
    expect(resolveScenarioEndVisibleCount(0, true)).toBe(1);
  });

  it("reveals all content frames in browse mode (CJM off)", () => {
    expect(resolveBrowseScenarioVisibleCount(8)).toBe(8);
    expect(resolveBrowseScenarioVisibleCount(0)).toBe(0);
  });

  it("prefers end visible count over partial state when restoreFullOnInit is set", () => {
    // Simulates CJM beat retreat: visibleCount may still be minVisible while
    // restoreFullOnInitRef requests full thread disclosure.
    const partial = 1;
    const end = resolveScenarioEndVisibleCount(8, true);
    expect(end).toBe(8);
    expect(end).toBeGreaterThan(partial);
  });
});
