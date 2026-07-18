import {
  deserializeRecordingSession,
  getActiveRecordingSession,
  serializeRecordingSession,
  startRecording,
  stopRecording,
  pauseRecording,
  resumeRecording,
  isRecordingActive,
} from "@/app/recording/protoRecordingSession";
import type { ProtoRecordingSession } from "@/app/recording/protoRecordingTypes";
import {
  compileRecordingToBeatTimeline,
  summarizeRecordingSession,
} from "@/app/recording/protoRecordingReplay";
import type { StartRecordingOptions } from "@/app/recording/protoRecordingSession";

declare global {
  interface Window {
    __protoStartRecording?: (
      options?: StartRecordingOptions
    ) => ProtoRecordingSession;
    __protoStopRecording?: () => ProtoRecordingSession | null;
    __protoPauseRecording?: () => boolean;
    __protoResumeRecording?: () => boolean;
    __protoIsRecording?: () => boolean;
    __protoGetRecording?: () => ProtoRecordingSession | null;
    __protoExportRecording?: () => string | null;
    __protoImportRecording?: (json: string) => ProtoRecordingSession;
    __protoCompileRecording?: (
      session?: ProtoRecordingSession
    ) => ReturnType<typeof compileRecordingToBeatTimeline>;
  }
}

export function registerProtoRecordingMcpHelpers(options?: {
  getDefaultStartOptions?: () => StartRecordingOptions;
}): () => void {
  if (typeof window === "undefined") return () => {};

  window.__protoStartRecording = (startOptions) => {
    const defaults = options?.getDefaultStartOptions?.() ?? {};
    return startRecording({ ...defaults, ...startOptions });
  };

  window.__protoStopRecording = () => stopRecording();

  window.__protoPauseRecording = () => pauseRecording();

  window.__protoResumeRecording = () => resumeRecording();

  window.__protoIsRecording = () => isRecordingActive();

  window.__protoGetRecording = () => getActiveRecordingSession();

  window.__protoExportRecording = () => {
    const session = getActiveRecordingSession();
    if (!session) return null;
    return serializeRecordingSession(session);
  };

  window.__protoImportRecording = (json) => deserializeRecordingSession(json);

  window.__protoCompileRecording = (session) => {
    const target = session ?? getActiveRecordingSession();
    if (!target) {
      throw new Error("No active recording session");
    }
    return compileRecordingToBeatTimeline(target);
  };

  return () => {
    delete window.__protoStartRecording;
    delete window.__protoStopRecording;
    delete window.__protoPauseRecording;
    delete window.__protoResumeRecording;
    delete window.__protoIsRecording;
    delete window.__protoGetRecording;
    delete window.__protoExportRecording;
    delete window.__protoImportRecording;
    delete window.__protoCompileRecording;
  };
}

export { summarizeRecordingSession };
