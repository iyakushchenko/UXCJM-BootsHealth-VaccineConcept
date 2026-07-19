import { describe, expect, it } from "vitest";
import { planStudioModalUrlBridgeApply } from "@/app/shell/studioModalUrlBridgePlan";

describe("planStudioModalUrlBridgeApply", () => {
  it("opens from URL when wire is ready and live is empty (deep-link)", () => {
    const plan = planStudioModalUrlBridgeApply({
      urlModalId: "quick-view",
      liveModalId: undefined,
      prevLiveModalId: undefined,
      closingModalId: undefined,
    });
    expect(plan.applyModalId).toBe("quick-view");
    expect(plan.nextClosingModalId).toBeUndefined();
  });

  it("does not re-open when live just cleared but URL still has modal (QV close race)", () => {
    const plan = planStudioModalUrlBridgeApply({
      urlModalId: "quick-view",
      liveModalId: undefined,
      prevLiveModalId: "quick-view",
      closingModalId: undefined,
    });
    expect(plan.applyModalId).toBeUndefined();
    expect(plan.nextClosingModalId).toBe("quick-view");
    expect(plan.nextPrevLiveModalId).toBeUndefined();
  });

  it("keeps suppress until URL clears the closed modal", () => {
    const mid = planStudioModalUrlBridgeApply({
      urlModalId: "quick-view",
      liveModalId: undefined,
      prevLiveModalId: undefined,
      closingModalId: "quick-view",
    });
    expect(mid.applyModalId).toBeUndefined();
    expect(mid.nextClosingModalId).toBe("quick-view");

    const done = planStudioModalUrlBridgeApply({
      urlModalId: undefined,
      liveModalId: undefined,
      prevLiveModalId: undefined,
      closingModalId: "quick-view",
    });
    expect(done.applyModalId).toBeUndefined();
    expect(done.nextClosingModalId).toBeUndefined();
  });

  it("no-ops when URL and live already match", () => {
    const plan = planStudioModalUrlBridgeApply({
      urlModalId: "choose-pharmacy",
      liveModalId: "choose-pharmacy",
      prevLiveModalId: "choose-pharmacy",
      closingModalId: undefined,
    });
    expect(plan.applyModalId).toBeUndefined();
    expect(plan.nextClosingModalId).toBeUndefined();
  });

  it("suppresses choose-pharmacy close the same way", () => {
    const plan = planStudioModalUrlBridgeApply({
      urlModalId: "choose-pharmacy",
      liveModalId: undefined,
      prevLiveModalId: "choose-pharmacy",
      closingModalId: undefined,
    });
    expect(plan.applyModalId).toBeUndefined();
    expect(plan.nextClosingModalId).toBe("choose-pharmacy");
  });

  it("allows a different URL modal after suppress clears", () => {
    const plan = planStudioModalUrlBridgeApply({
      urlModalId: "login",
      liveModalId: undefined,
      prevLiveModalId: undefined,
      closingModalId: "quick-view",
    });
    expect(plan.nextClosingModalId).toBeUndefined();
    expect(plan.applyModalId).toBe("login");
  });
});
