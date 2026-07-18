import { describe, expect, it } from "vitest";
import { scenarioScrollTiming } from "@/app/proto/protoScenarioEngine";

describe("scenarioScrollTiming", () => {
  it("defers scroll on step-back (after-exit)", () => {
    expect(scenarioScrollTiming(11, 10)).toBe("after-exit");
    expect(scenarioScrollTiming(3, 1)).toBe("after-exit");
  });

  it("defers scroll after frame enter on step-forward (after-enter)", () => {
    expect(scenarioScrollTiming(10, 11)).toBe("after-enter");
    expect(scenarioScrollTiming(1, 2)).toBe("after-enter");
  });

  it("keeps immediate timing when count unchanged", () => {
    expect(scenarioScrollTiming(5, 5)).toBe("immediate");
  });
});
