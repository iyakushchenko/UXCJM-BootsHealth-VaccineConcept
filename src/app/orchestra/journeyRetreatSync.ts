import { dispatchProtoRetreatSync } from "@/app/proto/protoRetreatBridge";
import {
  beatDirectorScriptLabel,
  isDwellLandingBeat,
} from "@/app/orchestra/journeyBeatDirector";
import type { JourneyBeat, JourneyRuntime } from "@/app/orchestra/types";
import { notePlaybackRetreatSync } from "@/app/shell/protoPlaybackInteractionContext";
import { playbackScrollMonitor } from "@/app/shell/protoPlaybackScrollMonitor";
import { syncAvailBeatRetreat } from "@/projects/boots-pharmacy/playback/availRetreatSync";
import { retreatScriptOptions } from "@/projects/playbackScriptOptions";
import type {
  ProtoProjectPlayback,
  RetreatSyncOptions,
  RetreatSelectionGoal,
  RetreatViewportGoal,
} from "@/projects/types";

export type BeatRetreatScriptChannel = "home" | "avail" | "book" | "tab";

/** Which playback runner owns retreat state for this beat (derived from beat metadata). */
export function beatRetreatScriptChannel(
  beat: JourneyBeat
): BeatRetreatScriptChannel | null {
  if (beat.homeScript) return "home";
  if (beat.availScript) return "avail";
  if (beat.bookScript) return "book";
  if (beat.tabScript) return "tab";
  return null;
}

export function beatHasRetreatableState(beat: JourneyBeat): boolean {
  return (
    beatRetreatScriptChannel(beat) != null ||
    (isDwellLandingBeat(beat) && Boolean(beat.protoTab))
  );
}

/**
 * Shell-owned CJM step-back sync — routes by beat script channel, never by project id
 * or screen-specific beat ids. Projects implement `syncState` on script runners and
 * optional `syncDwellRetreat` / `checkRetreatViewportGoal`.
 */
export async function syncBeatRetreatState(
  playback: ProtoProjectPlayback,
  beat: JourneyBeat,
  runtime: JourneyRuntime,
  options?: RetreatSyncOptions
): Promise<void> {
  const channel = beatRetreatScriptChannel(beat);
  const syncOptions = retreatScriptOptions(options?.instant);
  const scriptId =
    beat.homeScript ??
    beat.availScript ??
    beat.bookScript ??
    beat.tabScript ??
    beatDirectorScriptLabel(beat) ??
    beat.id;

  notePlaybackRetreatSync({ beatId: beat.id, scriptId });

  playbackScrollMonitor.noteRetreatSync();

  if (channel === "home" && beat.homeScript) {
    await playback.runHomeScript(beat.homeScript, syncOptions);
    dispatchProtoRetreatSync({
      beatId: beat.id,
      channel,
      scriptId: beat.homeScript,
    });
    return;
  }

  if (channel === "avail" && beat.availScript) {
    syncAvailBeatRetreat(beat, runtime);
    await playback.runAvailScript(beat.availScript, syncOptions);
    syncAvailBeatRetreat(beat, runtime);
    dispatchProtoRetreatSync({
      beatId: beat.id,
      channel,
      scriptId: beat.availScript,
    });
    return;
  }

  if (channel === "book" && beat.bookScript) {
    await playback.runBookScript(beat.bookScript, syncOptions);
    dispatchProtoRetreatSync({
      beatId: beat.id,
      channel,
      scriptId: beat.bookScript,
    });
    return;
  }

  if (channel === "tab" && beat.tabScript) {
    await playback.runTabScript(beat.tabScript, runtime, syncOptions);
    dispatchProtoRetreatSync({
      beatId: beat.id,
      channel,
      scriptId: beat.tabScript,
    });
    return;
  }

  if (isDwellLandingBeat(beat) && playback.syncDwellRetreat) {
    await playback.syncDwellRetreat(beat, options);
    dispatchProtoRetreatSync({
      beatId: beat.id,
      channel: "dwell",
      scriptId: beatDirectorScriptLabel(beat),
    });
  }
}

export function evaluateBeatRetreatViewportGoal(
  playback: ProtoProjectPlayback,
  beat: JourneyBeat
): RetreatViewportGoal | null {
  return playback.checkRetreatViewportGoal?.(beat) ?? null;
}

export function evaluateBeatRetreatSelectionGoal(
  playback: ProtoProjectPlayback,
  beat: JourneyBeat
): RetreatSelectionGoal | null {
  return playback.checkRetreatSelectionGoal?.(beat) ?? null;
}
