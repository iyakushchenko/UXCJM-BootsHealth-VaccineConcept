import type { JourneyBeat, JourneyRuntime } from "@/app/orchestra/types";
import type { AvailOpenIntent } from "@/projects/boots-pharmacy/overlays/AvailabilityTool";

/** Date shown when landing on avail-continue (matches onEnter open-availability-date-chat). */
export const AVAIL_RETREAT_DATE_INTENT = {
  month: "June",
  day: 25,
} as const;

/** Date picked by continue-from-date director playback. */
export const AVAIL_PLAYBACK_DATE = {
  month: "June",
  day: 21,
} as const;

/** Time picked by select-time-slot director playback. */
export const AVAIL_PLAYBACK_TIME = "15:30";

export function availRetreatIntentForBeat(beat: JourneyBeat): AvailOpenIntent | null {
  switch (beat.id) {
    case "avail-location":
      return { step: "list", query: "London" };
    case "avail-continue":
      return {
        step: "date",
        storeId: "covent",
        selectedDate: { ...AVAIL_RETREAT_DATE_INTENT },
      };
    case "avail-time":
      return {
        step: "time",
        storeId: "covent",
        selectedDate: { ...AVAIL_PLAYBACK_DATE },
      };
    case "avail-book":
      return {
        step: "time",
        storeId: "covent",
        selectedDate: { ...AVAIL_PLAYBACK_DATE },
        selectedTime: AVAIL_PLAYBACK_TIME,
      };
    default:
      return null;
  }
}

/** Re-open availability at the beat baseline before the director script re-runs. */
export function syncAvailBeatRetreat(
  beat: JourneyBeat,
  runtime: JourneyRuntime
): void {
  const intent = availRetreatIntentForBeat(beat);
  if (!intent) return;
  runtime.openAvailability({
    ...intent,
    replayKey: performance.now(),
  });
}
