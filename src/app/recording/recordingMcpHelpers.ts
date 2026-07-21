import {
  clearStagedRecordingSession,
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
  compileRecordingToJourney,
  saveRecordingAsJourney,
  type CompileRecordingJourneyOptions,
} from "@/app/recording/recordingCompile";
import {
  compileRecordingToBeatTimeline,
  replayRecordingSession,
  summarizeRecordingSession,
} from "@/app/recording/recordingReplay";
import type { StartRecordingOptions } from "@/app/recording/recordingSession";
import { armOverlayOnStudioHelpers } from "@/app/shell/helperOverlayArm";
import { simulateDemoPointerClick } from "@/app/scenario/demoCursor";
import { scrollCameraToTarget } from "@/app/scenario/playbackScroll";

function resolveRecordingSession(
  session?: RecordingSession
): RecordingSession | null {
  return session ?? getActiveRecordingSession() ?? getLastRecordingSession();
}

/** MCP callers often pass `{ label }` as the sole arg — treat as compile options. */
function resolveSessionOrCompileOptions(
  sessionOrOptions?: RecordingSession | CompileRecordingJourneyOptions,
  compileOptions?: CompileRecordingJourneyOptions
): {
  session: RecordingSession | null;
  options?: CompileRecordingJourneyOptions;
} {
  if (
    sessionOrOptions &&
    typeof sessionOrOptions === "object" &&
    !Array.isArray((sessionOrOptions as RecordingSession).events) &&
    ("label" in sessionOrOptions ||
      "journeyId" in sessionOrOptions ||
      "addAsNew" in sessionOrOptions)
  ) {
    return {
      session: resolveRecordingSession(undefined),
      options: sessionOrOptions as CompileRecordingJourneyOptions,
    };
  }
  return {
    session: resolveRecordingSession(sessionOrOptions as RecordingSession | undefined),
    options: compileOptions,
  };
}

declare global {
  interface Window {
    __protoStartRecording?: (
      options?: StartRecordingOptions
    ) => RecordingSession;
    __protoStopRecording?: () => RecordingSession | null;
    __protoClearRecording?: () => boolean;
    __protoPauseRecording?: () => boolean;
    __protoResumeRecording?: () => boolean;
    __protoIsRecording?: () => boolean;
    __protoGetRecording?: () => RecordingSession | null;
    __protoExportRecording?: (session?: RecordingSession) => string | null;
    __protoImportRecording?: (json: string) => RecordingSession;
    __protoCompileRecording?: (
      session?: RecordingSession
    ) => ReturnType<typeof compileRecordingToBeatTimeline>;
    __protoCompileRecordingToJourney?: (
      session?: RecordingSession,
      options?: CompileRecordingJourneyOptions
    ) => ReturnType<typeof compileRecordingToJourney>;
    __protoSaveRecordingAsJourney?: (
      session?: RecordingSession,
      options?: CompileRecordingJourneyOptions
    ) => ReturnType<typeof saveRecordingAsJourney>;
    __protoReplayRecording?: (
      session?: RecordingSession
    ) => Promise<import("@/app/recording/recordingTypes").RecordingReplayResult>;
    /** Agent REC demo — robo-cursor click (eased camera scroll). */
    __protoSimulateDemoPointerClick?: (
      target: HTMLElement | string,
      options?: { scroll?: boolean }
    ) => Promise<boolean>;
    __studioSimulateDemoPointerClick?: (
      target: HTMLElement | string,
      options?: { scroll?: boolean }
    ) => Promise<boolean>;
    /** Agent REC demo — eased camera to target (not abrupt jump). */
    __protoScrollCameraToTarget?: (
      target: HTMLElement | string,
      options?: { instant?: boolean }
    ) => Promise<void>;
    __studioScrollCameraToTarget?: (
      target: HTMLElement | string,
      options?: { instant?: boolean }
    ) => Promise<void>;
  }
}

export function registerRecordingMcpHelpers(options?: {
  getDefaultStartOptions?: () => StartRecordingOptions;
  triggerTransport?: (action: import("@/app/shell/playbackInteractionContext").ManualTransportAction) => void;
  applyScreen?: import("@/app/recording/recordingTypes").RecordingReplayOptions["applyScreen"];
  applyDemoClick?: import("@/app/recording/recordingTypes").RecordingReplayOptions["applyDemoClick"];
  applyWireIntent?: import("@/app/recording/recordingTypes").RecordingReplayOptions["applyWireIntent"];
  applyDirectorScript?: import("@/app/recording/recordingTypes").RecordingReplayOptions["applyDirectorScript"];
  applyBeatEnter?: import("@/app/recording/recordingTypes").RecordingReplayOptions["applyBeatEnter"];
  applyScroll?: import("@/app/recording/recordingTypes").RecordingReplayOptions["applyScroll"];
  applyTypedText?: import("@/app/recording/recordingTypes").RecordingReplayOptions["applyTypedText"];
  onJourneySaved?: () => void;
}): () => void {
  if (typeof window === "undefined") return () => {};

  window.__protoStartRecording = (startOptions) => {
    const defaults = options?.getDefaultStartOptions?.() ?? {};
    return startRecording({ ...defaults, ...startOptions });
  };

  window.__protoStopRecording = () => stopRecording();

  window.__protoClearRecording = () => clearStagedRecordingSession();

  window.__protoPauseRecording = () => pauseRecording();

  window.__protoResumeRecording = () => resumeRecording();

  window.__protoIsRecording = () => isRecordingActive();

  const resolveEl = (target: HTMLElement | string): HTMLElement | null => {
    if (typeof target === "string") {
      try {
        return document.querySelector<HTMLElement>(target);
      } catch {
        return null;
      }
    }
    return target;
  };

  window.__protoSimulateDemoPointerClick = async (target, clickOpts) => {
    const el = resolveEl(target);
    if (!el) return false;
    return simulateDemoPointerClick(el, {
      scroll: clickOpts?.scroll !== false,
    });
  };
  window.__studioSimulateDemoPointerClick =
    window.__protoSimulateDemoPointerClick;

  window.__protoScrollCameraToTarget = async (target, scrollOpts) => {
    const el = resolveEl(target);
    if (!el) return;
    await scrollCameraToTarget(el, { instant: scrollOpts?.instant === true });
  };
  window.__studioScrollCameraToTarget = window.__protoScrollCameraToTarget;

  window.__protoGetRecording = () =>
    getActiveRecordingSession() ?? getLastRecordingSession();

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

  window.__protoCompileRecordingToJourney = (session, compileOptions) => {
    const { session: target, options: opts } = resolveSessionOrCompileOptions(
      session,
      compileOptions
    );
    if (!target) {
      throw new Error("No recording session to compile");
    }
    return compileRecordingToJourney(target, opts);
  };

  window.__protoSaveRecordingAsJourney = (session, compileOptions) => {
    const { session: target, options: opts } = resolveSessionOrCompileOptions(
      session,
      compileOptions
    );
    if (!target) {
      throw new Error("No recording session to save as journey");
    }
    const defaults = options?.getDefaultStartOptions?.() ?? {};
    const saved = saveRecordingAsJourney(target, {
      ...opts,
      projectId: (target.projectId ?? defaults.projectId) as string | undefined,
      personaId: (target.personaId ?? defaults.personaId) as string | undefined,
    });
    options?.onJourneySaved?.();
    return saved;
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
      !options?.applyWireIntent &&
      !options?.applyDirectorScript &&
      !options?.applyBeatEnter &&
      !options?.applyScroll &&
      !options?.applyTypedText
    ) {
      throw new Error(
        "triggerTransport, applyScreen, applyDemoClick, applyWireIntent, applyDirectorScript, applyBeatEnter, applyScroll, or applyTypedText not available"
      );
    }
    return replayRecordingSession(target, {
      triggerTransport: options.triggerTransport,
      applyScreen: options.applyScreen,
      applyDemoClick: options.applyDemoClick,
      applyWireIntent: options.applyWireIntent,
      applyDirectorScript: options.applyDirectorScript,
      applyBeatEnter: options.applyBeatEnter,
      applyScroll: options.applyScroll,
      applyTypedText: options.applyTypedText,
      // Default ≥4s major-step hold (recordingReplay); omit override so capture gaps apply.
    });
  };

  armOverlayOnStudioHelpers();

  return () => {
    delete window.__protoStartRecording;
    delete window.__protoStopRecording;
    delete window.__protoClearRecording;
    delete window.__protoPauseRecording;
    delete window.__protoResumeRecording;
    delete window.__protoIsRecording;
    delete window.__protoGetRecording;
    delete window.__protoExportRecording;
    delete window.__protoImportRecording;
    delete window.__protoCompileRecording;
    delete window.__protoCompileRecordingToJourney;
    delete window.__protoSaveRecordingAsJourney;
    delete window.__protoReplayRecording;
    delete window.__protoSimulateDemoPointerClick;
    delete window.__studioSimulateDemoPointerClick;
    delete window.__protoScrollCameraToTarget;
    delete window.__studioScrollCameraToTarget;
  };
}

export { summarizeRecordingSession };
