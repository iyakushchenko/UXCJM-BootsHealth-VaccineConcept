import { describe, expect, it } from "vitest";
import { shouldCompleteJourneyPlayAfterScript } from "@/app/orchestra/journeyPlayAdvance";

describe("shouldCompleteJourneyPlayAfterScript", () => {
  it("completes continuous Play when script finishes on last beat", () => {
    expect(
      shouldCompleteJourneyPlayAfterScript({
        nextIndex: 10,
        beatCount: 10,
        isPlaying: true,
      })
    ).toBe(true);
  });

  it("does not complete mid-journey advance", () => {
    expect(
      shouldCompleteJourneyPlayAfterScript({
        nextIndex: 5,
        beatCount: 10,
        isPlaying: true,
      })
    ).toBe(false);
  });

  it("does not complete manual step on last beat (caller owns transport)", () => {
    expect(
      shouldCompleteJourneyPlayAfterScript({
        nextIndex: 10,
        beatCount: 10,
        isPlaying: true,
        manualStep: true,
      })
    ).toBe(false);
  });

  it("does not complete when already stopped", () => {
    expect(
      shouldCompleteJourneyPlayAfterScript({
        nextIndex: 10,
        beatCount: 10,
        isPlaying: false,
      })
    ).toBe(false);
  });
});
