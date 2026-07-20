import { describe, expect, it } from "vitest";
import {
  buildJourneyGoToTabTransition,
  resolveNavTransitionInstant,
} from "@/app/shell/navTransitionPolicy";

describe("resolveNavTransitionInstant", () => {
  it("honors explicit instant", () => {
    expect(
      resolveNavTransitionInstant({
        requestedInstant: true,
        hubOpen: true,
        currentIndex: 0,
        targetIndex: 1,
      })
    ).toBe(true);
  });

  it("skips crossfade on same-tab when hub already closed (book-step2 funnel)", () => {
    expect(
      resolveNavTransitionInstant({
        hubOpen: false,
        currentIndex: 5,
        targetIndex: 5,
      })
    ).toBe(true);
  });

  it("keeps crossfade when leaving hub onto same underlying tab", () => {
    expect(
      resolveNavTransitionInstant({
        hubOpen: true,
        currentIndex: 5,
        targetIndex: 5,
      })
    ).toBe(false);
  });

  it("keeps crossfade on real tab changes", () => {
    expect(
      resolveNavTransitionInstant({
        hubOpen: false,
        currentIndex: 5,
        targetIndex: 6,
      })
    ).toBe(false);
  });
});

describe("buildJourneyGoToTabTransition", () => {
  it("marks same-tab book-step2 advances as instant", () => {
    const { sameTab, transition } = buildJourneyGoToTabTransition({
      screenIndex: 5,
      hubOpen: false,
      currentIndex: 5,
      screenIdAfter: "book-step-2",
    });
    expect(sameTab).toBe(true);
    expect(transition.instant).toBe(true);
    expect(transition.sameTab).toBe(true);
    expect(transition.screenAfter).toBe("book-step-2");
  });
});
