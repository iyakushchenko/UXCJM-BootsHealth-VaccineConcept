import { describe, expect, it, vi, afterEach } from "vitest";
import {
  availRetreatIntentForBeat,
  AVAIL_RETREAT_DATE_INTENT,
  syncAvailBeatRetreat,
} from "@/projects/boots-pharmacy/playback/availRetreatSync";
import { syncBeatRetreatState } from "@/app/orchestra/journeyRetreatSync";
import type { JourneyBeat } from "@/app/orchestra/types";

describe("availRetreatSync", () => {
  it("resets avail-continue to the pre-director date step baseline", () => {
    const beat: JourneyBeat = {
      id: "avail-continue",
      label: "Choose date",
      kind: "overlay",
      availScript: "continue-from-date",
    };

    expect(availRetreatIntentForBeat(beat)).toEqual({
      step: "date",
      storeId: "covent",
      selectedDate: AVAIL_RETREAT_DATE_INTENT,
    });
  });

  it("opens availability with a replayKey on retreat", () => {
    const openAvailability = vi.fn();
    const runtime = { openAvailability } as never;
    const beat: JourneyBeat = {
      id: "avail-continue",
      label: "Choose date",
      kind: "overlay",
      availScript: "continue-from-date",
    };

    syncAvailBeatRetreat(beat, runtime);

    expect(openAvailability).toHaveBeenCalledWith(
      expect.objectContaining({
        step: "date",
        storeId: "covent",
        selectedDate: AVAIL_RETREAT_DATE_INTENT,
        replayKey: expect.any(Number),
      })
    );
  });
});

describe("syncBeatRetreatState availability", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("calls openAvailability once before avail syncState script", async () => {
    vi.stubGlobal("window", { dispatchEvent: vi.fn() });
    const openAvailability = vi.fn();
    const runAvailScript = vi.fn(async () => ({ ok: true as const }));
    const beat: JourneyBeat = {
      id: "avail-continue",
      label: "Choose date",
      kind: "overlay",
      availScript: "continue-from-date",
    };

    await syncBeatRetreatState(
      { runAvailScript } as never,
      beat,
      { openAvailability } as never,
      { instant: true }
    );

    expect(openAvailability).toHaveBeenCalledTimes(2);
    expect(openAvailability.mock.calls[0]?.[0]).toEqual(
      expect.objectContaining({
        step: "date",
        selectedDate: AVAIL_RETREAT_DATE_INTENT,
      })
    );
    expect(openAvailability.mock.calls[1]?.[0]).toEqual(
      expect.objectContaining({
        step: "date",
        selectedDate: AVAIL_RETREAT_DATE_INTENT,
      })
    );
    expect(runAvailScript).toHaveBeenCalledWith(
      "continue-from-date",
      expect.objectContaining({ syncState: true, skip: true })
    );
  });
});
