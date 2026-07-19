import type {
  JourneyBeatActionId,
  ProtoOrchestraModeId,
} from "@/app/orchestra/types";
import type { PlaybackStudioSnapshot } from "@/app/shell/playbackStudioSnapshot";
import type { ManualTransportAction } from "@/app/shell/protoPlaybackInteractionContext";

/** Studio state captured at event time — aligned with MCP + diagnostic snapshots. */
export type ProtoRecordingSnapshot = PlaybackStudioSnapshot & {
  journeyMode?: boolean;
  scrollLock?: boolean;
  orchestraMode?: ProtoOrchestraModeId | null;
  counter?: string | null;
};

export type ProtoRecordedTransportEvent = {
  kind: "transport";
  action: ManualTransportAction;
  atMs: number;
  snapshot?: ProtoRecordingSnapshot;
};

export type ProtoRecordedStudioEvent = {
  kind: "studio";
  field: "journey-mode" | "orchestra-mode" | "project" | "persona";
  value: string | boolean;
  atMs: number;
  snapshot?: ProtoRecordingSnapshot;
};

export type ProtoRecordedDemoClickEvent = {
  kind: "demo-click";
  /** Human-readable descriptor from describePlaybackElement. */
  element: string;
  /** Nearest data-proto-* / data-name chain for replay targeting. */
  selectorChain?: string[];
  beatId?: string;
  touchpointKey?: string;
  atMs: number;
  snapshot?: ProtoRecordingSnapshot;
};

export type ProtoRecordedWireIntentEvent = {
  kind: "wire-intent";
  intentId: JourneyBeatActionId | string;
  payload?: Record<string, unknown>;
  atMs: number;
  snapshot?: ProtoRecordingSnapshot;
};

export type ProtoRecordedScrollEvent = {
  kind: "scroll";
  scrollTop?: number;
  anchorSelector?: string;
  atMs: number;
  snapshot?: ProtoRecordingSnapshot;
};

export type ProtoRecordedTouchpointEvent = {
  kind: "touchpoint";
  touchpointKey: string;
  beatId?: string;
  label?: string;
  counter?: string | null;
  atMs: number;
  snapshot?: ProtoRecordingSnapshot;
};

export type ProtoRecordedDwellEvent = {
  kind: "dwell";
  durationMs?: number;
  atMs: number;
  snapshot?: ProtoRecordingSnapshot;
};

export type ProtoRecordedDirectorEvent = {
  kind: "director-script";
  scriptId: string;
  scriptKind?: string;
  beatId?: string;
  manual?: boolean;
  atMs: number;
  snapshot?: ProtoRecordingSnapshot;
};

export type ProtoRecordedBeatEnterEvent = {
  kind: "beat-enter";
  actionId: string;
  beatId?: string;
  atMs: number;
  snapshot?: ProtoRecordingSnapshot;
};

export type ProtoRecordedEvent =
  | ProtoRecordedTransportEvent
  | ProtoRecordedStudioEvent
  | ProtoRecordedDemoClickEvent
  | ProtoRecordedWireIntentEvent
  | ProtoRecordedScrollEvent
  | ProtoRecordedTouchpointEvent
  | ProtoRecordedDwellEvent
  | ProtoRecordedDirectorEvent
  | ProtoRecordedBeatEnterEvent;

export type ProtoRecordingJourneyCatalogEntry = {
  id: string;
  label: string;
  beatCount: number;
  beatIds: string[];
};

export type ProtoRecordingSessionMetadata = {
  userAgent?: string;
  recordedFrom?: "mcp" | "dev" | "ui";
  notes?: string;
};

export type ProtoRecordingSession = {
  id: string;
  version: 1;
  startedAt: string;
  stoppedAt?: string;
  projectId?: string;
  personaId?: string;
  journeyId?: string;
  orchestraMode?: ProtoOrchestraModeId | null;
  /** Persona journey catalog at record start — for compile/replay context. */
  journeyCatalog?: ProtoRecordingJourneyCatalogEntry[];
  paused?: boolean;
  events: ProtoRecordedEvent[];
  metadata?: ProtoRecordingSessionMetadata;
};

export type CompiledBeatSegment = {
  touchpointKey: string;
  beatId?: string;
  label?: string;
  counter?: string | null;
  startedAtMs: number;
  events: ProtoRecordedEvent[];
};

export type CompiledRecordingTimeline = {
  sessionId: string;
  segments: CompiledBeatSegment[];
  /** Events before the first touchpoint marker. */
  preamble: ProtoRecordedEvent[];
};

export type ProtoRecordingReplayOptions = {
  triggerTransport?: (action: ManualTransportAction) => void | Promise<void>;
  /** Delay between transport events (ms). Default 400. */
  stepDelayMs?: number;
  /** v2 — replay demo clicks via simulateDemoPointerClick. */
  replayDemoClicks?: boolean;
  /** v2 — replay wire intents via runBeatAction. */
  replayWireIntents?: boolean;
  shouldAbort?: () => boolean;
};

export type ProtoRecordingReplayResult = {
  replayed: number;
  skipped: number;
  unsupported: number;
  errors: string[];
};
