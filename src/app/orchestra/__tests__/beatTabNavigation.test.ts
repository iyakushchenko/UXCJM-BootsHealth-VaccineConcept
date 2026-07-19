import { describe, expect, it, vi } from "vitest";
import {
  navigateToBeatTab,
  shouldNavigateBeatTabOnEnter,
} from "@/app/orchestra/beatTabNavigation";
import { AGENTIC_CJM_JOURNEY } from "@/projects/boots-pharmacy/personas/sarah-jenkins/journeys";
import {
  INDEX_BOOK_STEP1,
  PROJECT_SCREENS,
  studioTabToIndex,
} from "@/projects/boots-pharmacy/screens/screens";
import { resolveBeatIndexForScreenTab } from "@/app/orchestra/journeyUtils";

describe("shouldNavigateBeatTabOnEnter", () => {
  it("blocks tab snaps while browsing (CJM off)", () => {
    expect(shouldNavigateBeatTabOnEnter(true, false)).toBe(false);
    expect(shouldNavigateBeatTabOnEnter(true, true)).toBe(false);
  });

  it("allows tab nav in CJM after initial suppress clears", () => {
    expect(shouldNavigateBeatTabOnEnter(false, false)).toBe(true);
    expect(shouldNavigateBeatTabOnEnter(false, true)).toBe(false);
  });
});

describe("navigateToBeatTab", () => {
  it("always calls goToTab even when index already matches (hub leak)", () => {
    const goToTab = vi.fn();
    // Same tab as start beat — old code skipped goToTab and left hubOpen=true.
    navigateToBeatTab({ goToTab }, 0, { instant: true });
    expect(goToTab).toHaveBeenCalledTimes(1);
    expect(goToTab).toHaveBeenCalledWith(0, { instant: true });
  });
});

describe("Book Step 1 vs agentic beat fallback", () => {
  it("maps Book Step 1 screen index to proto tab 5", () => {
    expect(INDEX_BOOK_STEP1).toBe(4);
    expect(PROJECT_SCREENS[INDEX_BOOK_STEP1]?.label).toMatch(/step 1/i);
    expect(studioTabToIndex(5)).toBe(INDEX_BOOK_STEP1);
  });

  it("agentic CJM has no beat on Book Step 1 tab (fallback only for beat index)", () => {
    const beatIndex = resolveBeatIndexForScreenTab(
      AGENTIC_CJM_JOURNEY,
      INDEX_BOOK_STEP1,
      () => false
    );
    expect(beatIndex).toBe(0);
    expect(AGENTIC_CJM_JOURNEY.beats[0]?.id).toBe("agentic-home");
    // Browse must not follow that fallback via shouldNavigateBeatTabOnEnter
    expect(shouldNavigateBeatTabOnEnter(true, false)).toBe(false);
  });
});
