import { describe, expect, it } from "vitest";
import { scenarioScrollTiming } from "@/app/proto/protoScenarioEngine";

describe("scenarioScrollTiming", () => {
  it("defers scroll on step-back (after-exit)", () => {
    expect(scenarioScrollTiming(11, 10)).toBe("after-exit");
    expect(scenarioScrollTiming(3, 1)).toBe("after-exit");
  });

  it("keeps immediate timing on step-forward and no-op", () => {
    expect(scenarioScrollTiming(10, 11)).toBe("immediate");
    expect(scenarioScrollTiming(5, 5)).toBe("immediate");
  });
});
