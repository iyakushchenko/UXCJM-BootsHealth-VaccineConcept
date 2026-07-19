import {
  deserializeRecordingSession,
  getActiveRecordingSession,
  getLastRecordingSession,
  serializeRecordingSession,
  startRecording,
  stopRecording,
  pauseRecording,
  resumeRecording,
  isRecordingActive,
  stageRecordingSession,
} from "@/app/recording/recordingSession";
import type { RecordingSession } from "@/app/recording/recordingTypes";
import {
  compileRecordingToBeatTimeline,
  replayRecordingSession,
  summarizeRecordingSession,
} from "@/app/recording/recordingReplay";
import type { StartRecordingOptions } from "@/app/recording/recordingSession";
import { armOverlayOnStudioHelpers } from "@/app/shell/helperOverlayArm";

function resolveRecordingSession(
  session?: RecordingSession
): RecordingSession | null {
  return session ?? getActiveRecordingSession() ?? getLastRecordingSession();
}

declare global {
  interface Window {
    __protoStartRecording?: (
      options?: StartRecordingOptions
    ) => RecordingSession;
    __protoStopRecording?: () => RecordingSession | null;
    __protoPauseRecording?: () => boolean;
    __protoResumeRecording?: () => boolean;
    __protoIsRecording?: () => boolean;
    __protoGetRecording?: () => RecordingSession | null;
    __protoExportRecording?: (session?: RecordingSession) => string | null;
    __protoImportRecording?: (json: string) => RecordingSession;
    __protoCompileRecording?: (
      session?: RecordingSession
    ) => ReturnType<typeof compileRecordingToBeatTimeline>;
    __protoReplayRecording?: (
      session?: RecordingSession
    ) => Promise<import("@/app/recording/recordingTypes").RecordingReplayResult>;
  }
}

export function registerRecordingMcpHelpers(options?: {
  getDefaultStartOptions?: () => StartRecordingOptions;
  triggerTransport?: (action: import("@/app/shell/playbackInteractionContext").ManualTransportAction) => void;
  applyScreen?: import("@/app/recording/recordingTypes").RecordingReplayOptions["applyScreen"];
  applyDemoClick?: import("@/app/recording/recordingTypes").RecordingReplayOptions["applyDemoClick"];
  applyWireIntent?: import("@/app/recording/recordingTypes").RecordingReplayOptions["applyWireIntent"];
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

  window.__protoExportRecording = (session) => {
    const target = resolveRecordingSession(session);
    if (!target) return null;
    return serializeRecordingSession(target);
  };

  window.__protoImportRecording = (json) => {
    const imported = deserializeRecordingSession(json);
    stageRecordingSession(imported);
    return imported;
  };

  window.__protoCompileRecording = (session) => {
    const target = resolveRecordingSession(session);
    if (!target) {
      throw new Error("No recording session to compile");
    }
    return compileRecordingToBeatTimeline(target);
  };

  window.__protoReplayRecording = async (session) => {
    const target = resolveRecordingSession(session);
    if (!target) {
      throw new Error("No recording session to replay");
    }
    if (
      !options?.triggerTransport &&
      !options?.applyScreen &&
      !options?.applyDemoClick &&
      !options?.applyWireIntent
    ) {
      throw new Error(
        "triggerTransport, applyScreen, applyDemoClick, or applyWireIntent not available"
      );
    }
    return replayRecordingSession(target, {
      triggerTransport: options.triggerTransport,
      applyScreen: options.applyScreen,
      applyDemoClick: options.applyDemoClick,
      applyWireIntent: options.applyWireIntent,
      stepDelayMs: 200,
    });
  };

  armOverlayOnStudioHelpers();

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
    delete window.__protoReplayRecording;
  };
}

export { summarizeRecordingSession };
