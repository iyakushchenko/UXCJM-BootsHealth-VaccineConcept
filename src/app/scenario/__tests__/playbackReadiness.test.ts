/** @vitest-environment happy-dom */
import { describe, expect, it, vi } from "vitest";
import { playbackReadinessDelay } from "@/app/scenario/playbackReadiness";
import { setPlaybackTimingMode } from "@/app/shell/playbackTiming";

describe("playbackReadinessDelay", () => {
  it("is not compressed by fast presentation timing", async () => {
    vi.useFakeTimers();
    setPlaybackTimingMode("fast");
    let ready = false;
    const waiting = playbackReadinessDelay(50).then(() => { ready = true; });
    await vi.advanceTimersByTimeAsync(12);
    expect(ready).toBe(false);
    await vi.advanceTimersByTimeAsync(38);
    await waiting;
    expect(ready).toBe(true);
    setPlaybackTimingMode("normal");
    vi.useRealTimers();
  });
});
