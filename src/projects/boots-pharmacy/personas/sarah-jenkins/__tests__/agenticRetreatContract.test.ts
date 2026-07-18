import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import {
  beatHasRetreatableState,
  beatRetreatScriptChannel,
  syncBeatRetreatState,
} from "@/app/orchestra/journeyRetreatSync";
import {
  availRetreatIntentForBeat,
  AVAIL_PLAYBACK_DATE,
  AVAIL_PLAYBACK_TIME,
  AVAIL_RETREAT_DATE_INTENT,
} from "@/projects/boots-pharmacy/playback/availRetreatSync";
import { AGENTIC_CJM_JOURNEY } from "@/projects/boots-pharmacy/personas/sarah-jenkins/journeys";
import { BOOTS_PHARMACY_PLAYBACK } from "@/projects/boots-pharmacy/playback";
import { checkRetreatSelectionGoal } from "@/projects/boots-pharmacy/playback/retreatSelectionGoal";
import type { JourneyBeat, JourneyRuntime } from "@/app/orchestra/types";

const AGENTIC_AVAIL_BEATS = AGENTIC_CJM_JOURNEY.beats.filter(
  (beat) => beat.availScript
);
const AGENTIC_BOOK_BEATS = AGENTIC_CJM_JOURNEY.beats.filter(
  (beat) => beat.bookScript
);

function stubWindow() {
  vi.stubGlobal("window", { dispatchEvent: vi.fn() });
}

describe("agentic CJM retreat contract", () => {
  beforeEach(() => {
    stubWindow();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  describe.each(AGENTIC_AVAIL_BEATS.map((beat) => [beat.id, beat] as const))(
    "avail beat %s",
    (_beatId, beat) => {
      it("defines a retreat baseline intent", () => {
        expect(availRetreatIntentForBeat(beat)).not.toBeNull();
        expect(beatRetreatScriptChannel(beat)).toBe("avail");
      });

      it("step-back opens availability then runs syncState script", async () => {
        const openAvailability = vi.fn();
        const runAvailScript = vi.fn(async () => ({ ok: true as const }));
        const runtime = { openAvailability } as unknown as JourneyRuntime;

        await syncBeatRetreatState(
          { runAvailScript } as never,
          beat,
          runtime,
          { instant: true }
        );

        expect(openAvailability).toHaveBeenCalledWith(
          expect.objectContaining({
            ...availRetreatIntentForBeat(beat),
            replayKey: expect.any(Number),
          })
        );
        expect(runAvailScript).toHaveBeenCalledWith(
          beat.availScript,
          expect.objectContaining({ skip: true, syncState: true, instant: true })
        );
      });
    }
  );

  describe.each(AGENTIC_BOOK_BEATS.map((beat) => [beat.id, beat] as const))(
    "book beat %s",
    (_beatId, beat) => {
      it("routes step-back through book syncState", async () => {
        const runBookScript = vi.fn(async () => ({ ok: true as const }));

        await syncBeatRetreatState(
          { runBookScript } as never,
          beat,
          {} as JourneyRuntime,
          { instant: true }
        );

        expect(beatRetreatScriptChannel(beat)).toBe("book");
        expect(runBookScript).toHaveBeenCalledWith(
          beat.bookScript,
          expect.objectContaining({ skip: true, syncState: true, instant: true })
        );
      });
    }
  );

  it("covers every agentic avail/book beat in this contract", () => {
    expect(AGENTIC_AVAIL_BEATS.map((beat) => beat.id)).toEqual([
      "avail-location",
      "avail-continue",
      "avail-time",
      "avail-book",
    ]);
    expect(AGENTIC_BOOK_BEATS.map((beat) => beat.id)).toEqual([
      "book-step2-date",
      "book-step2-time",
      "book-step2-reserve",
    ]);
  });

  it("maps known avail retreat baselines", () => {
    const beat = (id: string): JourneyBeat =>
      AGENTIC_CJM_JOURNEY.beats.find((entry) => entry.id === id)!;

    expect(availRetreatIntentForBeat(beat("avail-continue"))).toEqual({
      step: "date",
      storeId: "covent",
      selectedDate: AVAIL_RETREAT_DATE_INTENT,
    });
    expect(availRetreatIntentForBeat(beat("avail-time"))).toEqual({
      step: "time",
      storeId: "covent",
      selectedDate: AVAIL_PLAYBACK_DATE,
    });
    expect(availRetreatIntentForBeat(beat("avail-book"))).toEqual({
      step: "time",
      storeId: "covent",
      selectedDate: AVAIL_PLAYBACK_DATE,
      selectedTime: AVAIL_PLAYBACK_TIME,
    });
  });

  it("agentic dwell book landing remains retreatable without a director script", () => {
    const beat = AGENTIC_CJM_JOURNEY.beats.find((entry) => entry.id === "book-step2");
    expect(beat).toBeDefined();
    expect(beatHasRetreatableState(beat!)).toBe(true);
  });

  it("registers selection goal hook for monitored avail/book beats", () => {
    const monitoredIds = [
      "avail-continue",
      "avail-time",
      "avail-book",
      "book-step2",
      "book-step2-date",
      "book-step2-time",
      "book-step2-reserve",
    ];

    expect(BOOTS_PHARMACY_PLAYBACK.checkRetreatSelectionGoal).toBe(
      checkRetreatSelectionGoal
    );
    expect(monitoredIds.every((id) => AGENTIC_CJM_JOURNEY.beats.some((beat) => beat.id === id))).toBe(
      true
    );
  });
});
