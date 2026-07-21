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

    // Layout jiggle inside settle band — must NOT mint a second wait.
    expect(noteScrollSample(tracker, 410, 3000)).toBeNull();
    expect(tracker.armed).toBe(false);
    expect(noteScrollIdle(tracker, 3000 + SCROLL_STOP_DWELL_MS)).toBeNull();

    // Clear leave of settle band re-arms.
    noteScrollSample(tracker, 800, 5000);
    expect(tracker.armed).toBe(true);
    const again = noteScrollIdle(tracker, 5000 + SCROLL_STOP_DWELL_MS);
    expect(again).toMatchObject({ scrollTop: 800 });
    expect(again!.dwellMs).toBeGreaterThanOrEqual(SCROLL_STOP_DWELL_MS);
  });

  it("flush pattern: keep noteScrollSample emit (idle alone is null after)", () => {
    // Mirrors flushRecordingScrollStop — same-top seed can emit inside
    // noteScrollSample and clear armed; noteScrollIdle then returns null.
    const tracker = createScrollStopTracker();
    noteScrollSample(tracker, 0, 0);
    noteScrollSample(tracker, 500, 10);
    const at = 10 + SCROLL_STOP_DWELL_MS;
    const fromSample = noteScrollSample(tracker, 500, at);
    const fromIdle = noteScrollIdle(tracker, at);
    expect(fromSample).not.toBeNull();
    expect(fromIdle).toBeNull();
    expect(fromSample ?? fromIdle).toMatchObject({
      scrollTop: 500,
      dwellMs: SCROLL_STOP_DWELL_MS,
    });
  });

  it("baseline lastTop + one jump arms (REC install seed pattern)", () => {
    const tracker = createScrollStopTracker();
    // Simulate listener install seeding current scrollTop without arming.
    tracker.lastTop = 0;
    expect(noteScrollSample(tracker, 900, 5)).toBeNull();
    expect(tracker.armed).toBe(true);
    const stop = noteScrollIdle(tracker, 5 + SCROLL_STOP_DWELL_MS);
    expect(stop).toMatchObject({ scrollTop: 900 });
  });
});
