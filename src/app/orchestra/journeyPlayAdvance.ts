/**
 * After a director / camera / recorded-click script finishes: decide whether
 * continuous Play must call completeJourneyPlay.
 *
 * scheduleDwellAdvance refuses beats that still carry recordedClick / camera /
 * *Script — so last-beat script runners MUST complete Play themselves or the
 * cassette stalls until playback-stall / idle timeout.
 */

export function shouldCompleteJourneyPlayAfterScript(options: {
  nextIndex: number;
  beatCount: number;
  isPlaying: boolean;
  manualStep?: boolean;
}): boolean {
  return (
    options.nextIndex >= options.beatCount &&
    options.isPlaying &&
    !options.manualStep
  );
}
