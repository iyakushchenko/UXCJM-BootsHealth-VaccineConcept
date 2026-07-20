import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createPlaybackScrollMonitor } from "@/app/shell/playbackScrollMonitor";

describe("playbackScrollMonitor", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(0);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("suppresses scroll jumps during navigation grace after screen change", () => {
    const anomalies: string[] = [];
    const monitor = createPlaybackScrollMonitor();
    monitor.setOnAnomaly((a) => anomalies.push(a.kind));
    monitor.setActive(true);

    monitor.onPassiveScroll(78);
    monitor.noteScreenChange();
    monitor.onPassiveScroll(0);

    expect(anomalies).toEqual([]);
  });

  it("suppresses instant scroll jumps during CJM retreat sync", () => {
    const anomalies: string[] = [];
    const monitor = createPlaybackScrollMonitor();
    monitor.setOnAnomaly((a) => anomalies.push(a.kind));
    monitor.setActive(true);

    monitor.onPassiveScroll(0);
    monitor.noteRetreatSync();
    monitor.onPassiveScroll(750);

    expect(anomalies).toEqual([]);
  });

  it("suppresses scroll jumps during scenario frame step-back retreat sync", () => {
    const anomalies: string[] = [];
    const monitor = createPlaybackScrollMonitor();
    monitor.setOnAnomaly((a) => anomalies.push(a.kind));
    monitor.setActive(true);

    monitor.onPassiveScroll(900);
    monitor.noteRetreatSync();
    monitor.onPassiveScroll(820);

    expect(anomalies).toEqual([]);
  });

  it("suppresses animation cancel during CJM retreat sync", () => {
    const anomalies: string[] = [];
    const monitor = createPlaybackScrollMonitor();
    monitor.setOnAnomaly((a) => anomalies.push(a.kind));
    monitor.setActive(true);

    monitor.onAnimationStart({ startTop: 465, targetTop: 599, duration: 720 });
    monitor.noteRetreatSync();
    monitor.onAnimationCancelled();

    expect(anomalies).toEqual([]);
  });

  it("replace-style end does not report scroll-interrupted", () => {
    const anomalies: string[] = [];
    const monitor = createPlaybackScrollMonitor();
    monitor.setOnAnomaly((a) => anomalies.push(a.kind));
    monitor.setActive(true);

    monitor.onAnimationStart({ startTop: 0, targetTop: 400, duration: 500 });
    monitor.onAnimationEnd({
      completed: false,
      finalTop: 120,
      replaced: true,
    });

    expect(anomalies).toEqual([]);
  });

  it("still reports jumps when not in navigation grace", () => {
    const anomalies: string[] = [];
    const monitor = createPlaybackScrollMonitor();
    monitor.setOnAnomaly((a) => anomalies.push(a.kind));
    monitor.setActive(true);

    monitor.onPassiveScroll(0);
    monitor.onPassiveScroll(180);

    expect(anomalies).toContain("scroll-jump");
  });

  it("noteScrollPosition resets baseline after layout-driven clamp", () => {
    const anomalies: string[] = [];
    const monitor = createPlaybackScrollMonitor();
    monitor.setOnAnomaly((a) => anomalies.push(a.kind));
    monitor.setActive(true);

    monitor.onPassiveScroll(1094);
    monitor.noteScrollPosition(1034);
    monitor.onPassiveScroll(1034);

    expect(anomalies).toEqual([]);
  });

  it("reports stacked eased scrolls during a director script", () => {
    const anomalies: string[] = [];
    const monitor = createPlaybackScrollMonitor();
    monitor.setOnAnomaly((a) => anomalies.push(a.kind));
    monitor.setActive(true);

    monitor.noteDirectorScriptStart({ scriptLabel: "reserve-appointment" });
    monitor.onAnimationStart({ startTop: 0, targetTop: 220, duration: 600 });
    monitor.onAnimationEnd({ completed: true, finalTop: 220, replaced: true });
    monitor.onAnimationStart({ startTop: 220, targetTop: 280, duration: 400 });

    expect(anomalies).toContain("scroll-competing");
  });

  it("reports excessive eased scroll burst after select-book-time script ends", () => {
    const anomalies: string[] = [];
    const monitor = createPlaybackScrollMonitor();
    monitor.setOnAnomaly((a) => anomalies.push(a.kind));
    monitor.setActive(true);

    monitor.noteDirectorScriptEnd({ scriptLabel: "select-book-time" });
    monitor.onAnimationStart({ startTop: 0, targetTop: 220, duration: 600 });
    monitor.onAnimationEnd({ completed: true, finalTop: 220 });
    monitor.onAnimationStart({ startTop: 220, targetTop: 480, duration: 600 });

    expect(anomalies).toContain("scroll-excessive-burst");
  });

  it("allows one follow-up eased scroll after select-book-time script ends", () => {
    const anomalies: string[] = [];
    const monitor = createPlaybackScrollMonitor();
    monitor.setOnAnomaly((a) => anomalies.push(a.kind));
    monitor.setActive(true);

    monitor.noteDirectorScriptEnd({ scriptLabel: "select-book-time" });
    monitor.onAnimationStart({ startTop: 0, targetTop: 220, duration: 600 });
    monitor.onAnimationEnd({ completed: true, finalTop: 220 });
    vi.advanceTimersByTime(1500);

    expect(anomalies).toEqual([]);
  });

  it("clears burst watch when proto tab changes", () => {
    const anomalies: string[] = [];
    const monitor = createPlaybackScrollMonitor();
    monitor.setOnAnomaly((a) => anomalies.push(a.kind));
    monitor.setActive(true);

    monitor.noteDirectorScriptEnd({ scriptLabel: "reserve-appointment" });
    monitor.noteScreenChange();
    monitor.onAnimationStart({ startTop: 1491, targetTop: 0, duration: 600 });
    monitor.onAnimationEnd({ completed: true, finalTop: 0 });
    monitor.onAnimationStart({ startTop: 0, targetTop: 220, duration: 600 });

    expect(anomalies).toEqual([]);
  });

  it("preserves burst watch on reset while burst window is active", () => {
    const anomalies: string[] = [];
    const monitor = createPlaybackScrollMonitor();
    monitor.setOnAnomaly((a) => anomalies.push(a.kind));
    monitor.setActive(true);

    monitor.noteDirectorScriptEnd({ scriptLabel: "select-book-time" });
    expect(monitor.isBurstWatchActive()).toBe(true);

    monitor.reset();
    expect(monitor.isBurstWatchActive()).toBe(true);

    monitor.onAnimationStart({ startTop: 0, targetTop: 220, duration: 600 });
    monitor.onAnimationEnd({ completed: true, finalTop: 220 });
    monitor.onAnimationStart({ startTop: 220, targetTop: 480, duration: 600 });

    expect(anomalies).toContain("scroll-excessive-burst");
  });
});
