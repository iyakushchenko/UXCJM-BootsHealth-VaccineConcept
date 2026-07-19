import { afterEach, describe, expect, it, vi } from "vitest";
import {
  assertPlaybackPlayEndedAtStart,
  assertPlaybackTypeIn,
  getPlaybackDiagBundle,
  playbackDiagClear,
  playbackDiagLog,
  playbackDiagPlayEnd,
  playbackDiagTypeInEnd,
  playbackDiagTypeInProgress,
  playbackDiagTypeInSkip,
  playbackDiagTypeInStart,
} from "@/app/shell/playbackDiag";

describe("playbackDiag", () => {
  afterEach(() => {
    playbackDiagClear();
    vi.restoreAllMocks();
  });

  it("records type-in progress and asserts PASS", () => {
    const spy = vi.spyOn(console, "info").mockImplementation(() => {});
    playbackDiagTypeInStart("site-pilot", 20);
    for (let i = 1; i <= 20; i++) playbackDiagTypeInProgress(i);
    playbackDiagTypeInEnd(true);

    const bundle = getPlaybackDiagBundle();
    expect(bundle.typeIn.starts).toBe(1);
    expect(bundle.typeIn.ends).toBe(1);
    expect(bundle.typeIn.skips).toBe(0);
    expect(bundle.typeIn.progressSamples.length).toBeGreaterThanOrEqual(2);

    const assert = assertPlaybackTypeIn({ minSamples: 2, minChars: 8 });
    expect(assert.pass).toBe(true);
    expect(spy).toHaveBeenCalled();
  });

  it("FAIL when type-in was skipped", () => {
    vi.spyOn(console, "info").mockImplementation(() => {});
    playbackDiagTypeInSkip("site-pilot", "prefilled match");
    const assert = assertPlaybackTypeIn();
    expect(assert.pass).toBe(false);
    expect(assert.reason).toMatch(/type-in-skip/);
  });

  it("counts step / retreat events", () => {
    vi.spyOn(console, "info").mockImplementation(() => {});
    playbackDiagLog("step-forward", "test");
    playbackDiagLog("step-back", "test");
    playbackDiagLog("retreat-sync", "home:sarah-query-submit", {
      beatId: "agentic-home",
    });
    const bundle = getPlaybackDiagBundle();
    expect(bundle.step.forwards).toBe(1);
    expect(bundle.step.backs).toBe(1);
    expect(bundle.step.retreatSyncs).toBe(1);
  });

  it("assertPlayEndedAtStart requires play-end + start beat", () => {
    vi.spyOn(console, "info").mockImplementation(() => {});
    vi.stubGlobal("window", {
      __protoStudioState: () => ({
        beatId: "traditional-plp",
        isPlaying: false,
        isOnAir: false,
      }),
    });
    vi.stubGlobal("location", {
      search: "?project=boots-pharmacy&screen=plp&cjm=on",
    });

    expect(
      assertPlaybackPlayEndedAtStart({
        startBeatId: "traditional-plp",
        startScreenId: "plp",
      }).pass
    ).toBe(false);

    playbackDiagPlayEnd({
      fromBeatId: "appointment-details",
      toBeatId: "traditional-plp",
    });
    const assert = assertPlaybackPlayEndedAtStart({
      startBeatId: "traditional-plp",
      startScreenId: "plp",
    });
    expect(assert.pass).toBe(true);
    expect(getPlaybackDiagBundle().playEnd.count).toBe(1);
  });
});
