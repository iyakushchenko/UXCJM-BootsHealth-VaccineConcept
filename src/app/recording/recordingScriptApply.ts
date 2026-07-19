import type {
  AvailabilityScriptId,
  BookScriptId,
  HomeScriptId,
  JourneyRuntime,
  TabScriptId,
} from "@/app/orchestra/types";
import {
  resolvePlaybackScriptKind,
  type RunnablePlaybackScriptKind,
} from "@/app/shell/playbackScriptRegistry";
import type { PlaybackScriptOptions } from "@/projects/playbackScriptOptions";
import { isScriptOk } from "@/projects/playbackScriptResult";
import type { ProjectPlayback } from "@/projects/types";

export type RecordingScriptApplyInput = {
  scriptId: string;
  scriptKind?: string;
};

function normalizeScriptKind(
  input: RecordingScriptApplyInput
): RunnablePlaybackScriptKind | undefined {
  const raw = input.scriptKind;
  if (raw === "home" || raw === "avail" || raw === "book" || raw === "tab") {
    return raw;
  }
  return resolvePlaybackScriptKind(input.scriptId);
}

/**
 * Shared runner for recording replay of director-script / retreat-sync.
 * Routes by script channel — never by project id or screen folder.
 */
export async function applyRecordingProjectScript(
  input: RecordingScriptApplyInput,
  playback: ProjectPlayback,
  runtime: JourneyRuntime,
  options?: PlaybackScriptOptions
): Promise<boolean> {
  const kind = normalizeScriptKind(input);
  if (!kind) return false;

  const { scriptId } = input;
  let result;
  switch (kind) {
    case "home":
      result = await playback.runHomeScript(
        scriptId as HomeScriptId,
        options
      );
      break;
    case "avail":
      result = await playback.runAvailScript(
        scriptId as AvailabilityScriptId,
        options
      );
      break;
    case "book":
      result = await playback.runBookScript(
        scriptId as BookScriptId,
        options
      );
      break;
    case "tab":
      result = await playback.runTabScript(
        scriptId as TabScriptId,
        runtime,
        options
      );
      break;
    default:
      return false;
  }

  return isScriptOk(result);
}
