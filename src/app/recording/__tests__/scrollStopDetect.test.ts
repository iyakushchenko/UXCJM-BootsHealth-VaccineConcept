import { describe, expect, it } from "vitest";
import {
  SCROLL_JIGGLE_PX,
  SCROLL_STOP_DWELL_MS,
  createScrollStopTracker,
  isJiggleDelta,
  isMeaningfulScrollActivity,
  isShortOscillation,
  noteScrollIdle,
  noteScrollSample,
} from "@/app/recording/scrollStopDetect";

describe("scrollStopDetect", () => {
  it("treats small Δpx as jiggle", () => {
    expect(isJiggleDelta(0)).toBe(true);
    expect(isJiggleDelta(SCROLL_JIGGLE_PX - 1)).toBe(true);
    expect(isJiggleDelta(SCROLL_JIGGLE_PX)).toBe(false);
    expect(isJiggleDelta(-SCROLL_JIGGLE_PX)).toBe(false);
  });

  it("ignores short ups-downs as oscillation (not activity)", () => {
    const recent = [
      { atMs: 100, delta: 30 },
      { atMs: 150, delta: -28 },
    ];
    expect(isShortOscillation(recent, 200)).toBe(true);
    // Large instantaneous delta, but net travel in window is jiggle-sized.
    expect(isMeaningfulScrollActivity(25, recent, 200)).toBe(false);
  });

  it("emits stop after ≥2s quiet following meaningful scroll", () => {
    const tracker = createScrollStopTracker();
    expect(noteScrollSample(tracker, 0, 0)).toBeNull();
    expect(noteScrollSample(tracker, 200, 50)).toBeNull(); // meaningful
    expect(tracker.armed).toBe(true);

    // Jiggle during settle — not activity, does not reset.
    expect(noteScrollSample(tracker, 205, 100)).toBeNull();
    expect(tracker.lastMeaningfulAtMs).toBe(50);

    // Too early.
    expect(noteScrollIdle(tracker, 50 + SCROLL_STOP_DWELL_MS - 1)).toBeNull();

    const stop = noteScrollIdle(tracker, 50 + SCROLL_STOP_DWELL_MS);
    expect(stop).toMatchObject({
      dwellMs: SCROLL_STOP_DWELL_MS,
      scrollTop: 205,
    });
    expect(stop!.dwellMs).toBeGreaterThanOrEqual(SCROLL_STOP_DWELL_MS);
  });

  it("does not double-fire the same quiet stretch", () => {
    const tracker = createScrollStopTracker();
    noteScrollSample(tracker, 0, 0);
    noteScrollSample(tracker, 300, 10);
    const first = noteScrollIdle(tracker, 10 + SCROLL_STOP_DWELL_MS);
    expect(first).not.toBeNull();
    expect(noteScrollIdle(tracker, 10 + SCROLL_STOP_DWELL_MS + 500)).toBeNull();
  });

  it("re-arms after a new meaningful move", () => {
    const tracker = createScrollStopTracker();
    noteScrollSample(tracker, 0, 0);
    noteScrollSample(tracker, 400, 20);
    expect(noteScrollIdle(tracker, 20 + SCROLL_STOP_DWELL_MS)).not.toBeNull();

    noteScrollSample(tracker, 800, 3000);
    const again = noteScrollIdle(tracker, 3000 + SCROLL_STOP_DWELL_MS);
    expect(again).toMatchObject({ scrollTop: 800 });
    expect(again!.dwellMs).toBeGreaterThanOrEqual(SCROLL_STOP_DWELL_MS);
  });
});
