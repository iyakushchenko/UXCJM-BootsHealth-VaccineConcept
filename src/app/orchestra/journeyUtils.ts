import {
  isPopupSubstepOfBeat,
  isPopupTouchpoint,
  resolvePlaylistTouchpointIndex,
  type StudioTouchpointEntry,
} from "@/app/nav/resolveStudioTouchpoint";
import type { JourneyBeat, JourneyDefinition, OrchestraModeId } from "@/app/orchestra/types";

export type JourneyRetreatTarget =
  | { kind: "close-popups" }
  | { kind: "beat"; beatIndex: number; beat: JourneyBeat };

export function parseBeatIdFromTouchpointKey(key: string): string | undefined {
  return key.match(/^beat:([^:]+)/)?.[1];
}

/** Availability popup playlist keys → overlay beat for CJM step-back. */
const AVAIL_POPUP_BEAT_IDS: Record<string, string> = {
  "popup:availability:date": "avail-continue",
  "popup:availability:time": "avail-time",
};

/** Previous studio touchpoint when stepping back in CJM (playlist order, not book UI steps). */
export function resolveJourneyRetreatTarget(options: {
  playlist: readonly StudioTouchpointEntry[];
  currentTouchpointKey: string | undefined;
  currentBeatId: string | undefined;
  beats: JourneyBeat[];
  shouldSkipBeat: (beat: JourneyBeat | undefined) => boolean;
}): JourneyRetreatTarget | null {
  const {
    playlist,
    currentTouchpointKey,
    currentBeatId,
    beats,
    shouldSkipBeat,
  } = options;

  if (!currentTouchpointKey || playlist.length === 0) return null;

  const currentIndex = resolvePlaylistTouchpointIndex(
    [...playlist],
    currentTouchpointKey
  );
  if (currentIndex <= 0) return null;

  const prevEntry = playlist[currentIndex - 1];
  const prevBeatId = parseBeatIdFromTouchpointKey(prevEntry.key);

  // Location-list overlays: close before changing beat. Agentic list aliases to
  // `beat:avail-location` whose previous playlist slot is a chat frame, so the
  // old `prevBeatId === currentBeatId` check skipped close-popups and jumped to
  // chat/home while Choose Pharmacy stayed painted (PO Alarm home+list).
  // Date/time popups keep AVAIL_POPUP_BEAT_IDS retreat (stay in avail tool).
  const closePopupKeys = new Set([
    "popup:availability:list",
    "popup:availability:start",
    "popup:availability:map",
    "popup:availability:noSlots",
    "popup:login",
  ]);
  if (
    closePopupKeys.has(currentTouchpointKey) &&
    (isPopupSubstepOfBeat(currentBeatId, currentTouchpointKey) ||
      // Sticky Choose Pharmacy after beat retreated to home — close first.
      currentBeatId === "agentic-home")
  ) {
    return { kind: "close-popups" };
  }

  if (
    isPopupTouchpoint(currentTouchpointKey) &&
    currentBeatId &&
    prevBeatId === currentBeatId
  ) {
    return { kind: "close-popups" };
  }

  for (let scan = currentIndex - 1; scan >= 0; scan -= 1) {
    const entry = playlist[scan];
    if (isPopupTouchpoint(entry.key)) {
      const mappedBeatId = AVAIL_POPUP_BEAT_IDS[entry.key];
      if (mappedBeatId) {
        const beatIndex = beats.findIndex((beat) => beat.id === mappedBeatId);
        const beat = beats[beatIndex];
        if (beatIndex >= 0 && !shouldSkipBeat(beat)) {
          return { kind: "beat", beatIndex, beat };
        }
      }
      continue;
    }

    const beatId = parseBeatIdFromTouchpointKey(entry.key);
    if (!beatId) continue;

    const beatIndex = beats.findIndex((beat) => beat.id === beatId);
    const beat = beats[beatIndex];
    if (beatIndex < 0 || shouldSkipBeat(beat)) continue;

    return { kind: "beat", beatIndex, beat };
  }

  return null;
}

export function canRetreatJourneyTouchpoint(
  playlist: readonly StudioTouchpointEntry[],
  currentTouchpointKey: string | undefined
): boolean {
  if (!currentTouchpointKey || playlist.length === 0) return false;
  return resolvePlaylistTouchpointIndex([...playlist], currentTouchpointKey) > 0;
}

export function getJourneyForMode(
  journeys: JourneyDefinition[],
  modeId: OrchestraModeId
): JourneyDefinition | undefined {
  return journeys.find((journey) => journey.id === modeId);
}

export function stepBeatIndex(
  index: number,
  beats: JourneyBeat[],
  shouldSkip: (beat: JourneyBeat | undefined) => boolean,
  direction: 1 | -1
): number {
  let next = index + direction;
  while (next >= 0 && next < beats.length && shouldSkip(beats[next])) {
    next += direction;
  }
  return next;
}

export function lastPlayableBeatIndex(
  beats: JourneyBeat[],
  shouldSkip: (beat: JourneyBeat | undefined) => boolean
): number {
  for (let i = beats.length - 1; i >= 0; i--) {
    if (!shouldSkip(beats[i])) return i;
  }
  return 0;
}

export function firstPlayableBeatIndex(
  beats: JourneyBeat[],
  shouldSkip: (beat: JourneyBeat | undefined) => boolean
): number {
  for (let i = 0; i < beats.length; i++) {
    if (!shouldSkip(beats[i])) return i;
  }
  return 0;
}

/** First beat + index after applying persona skip hooks (journey restart / mode pick). */
export function resolveJourneyStartBeat(
  journey: JourneyDefinition | undefined,
  shouldSkip: (beat: JourneyBeat | undefined) => boolean
): { beatIndex: number; beat: JourneyBeat | undefined } {
  const beats = journey?.beats ?? [];
  const beatIndex = firstPlayableBeatIndex(beats, shouldSkip);
  return { beatIndex, beat: beats[beatIndex] };
}

/** Map zero-based screen index → first playable beat on that proto tab (manual nav / refresh). */
export function resolveBeatIndexForScreenTab(
  journey: JourneyDefinition | undefined,
  screenIndex: number,
  shouldSkip: (beat: JourneyBeat | undefined) => boolean
): number {
  const beats = journey?.beats ?? [];
  if (beats.length === 0) return 0;

  const protoTab = screenIndex + 1;
  for (let i = 0; i < beats.length; i++) {
    if (shouldSkip(beats[i])) continue;
    if (beats[i]?.protoTab === protoTab) return i;
  }

  return firstPlayableBeatIndex(beats, shouldSkip);
}
