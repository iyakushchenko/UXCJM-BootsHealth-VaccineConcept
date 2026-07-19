import { describe, expect, it } from "vitest";
import {
  PROJECT_SCREENS,
  studioNavIndex,
  studioScreenAtTab,
  studioTabToIndex,
} from "@/projects/boots-pharmacy/screens/screens";

describe("studioTabToIndex", () => {
  it("maps display tab 1 to index 0", () => {
    expect(studioTabToIndex(1)).toBe(0);
    expect(studioScreenAtTab(1)?.childIndex).toBe(11);
  });

  it("maps PLP tab 3 to childIndex 9", () => {
    expect(studioTabToIndex(3)).toBe(2);
    expect(PROJECT_SCREENS[studioTabToIndex(3)].childIndex).toBe(9);
  });

  it("clamps out-of-range tabs", () => {
    expect(studioTabToIndex(0)).toBe(0);
    expect(studioTabToIndex(99)).toBe(PROJECT_SCREENS.length - 1);
  });
});

describe("studioNavIndex", () => {
  it("returns 0 for hub", () => {
    expect(studioNavIndex(true, 5)).toBe(0);
  });

  it("returns current + 1 for prototype screens", () => {
    expect(studioNavIndex(false, 0)).toBe(1);
    expect(studioNavIndex(false, 2)).toBe(3);
  });
});

describe("PROJECT_SCREENS", () => {
  it("has unique childIndex values", () => {
    const indices = PROJECT_SCREENS.map((s) => s.childIndex);
    expect(new Set(indices).size).toBe(indices.length);
  });

  it("exposes stable screenId deep-link keys for book flow + home", () => {
    const byId = Object.fromEntries(
      PROJECT_SCREENS.map((s) => [s.screenId, s.childIndex])
    );
    expect(byId.home).toBe(11);
    expect(byId["book-step-1"]).toBe(7);
    expect(byId["book-step-2"]).toBe(4);
    expect(byId["book-step-3"]).toBe(3);
  });
});
