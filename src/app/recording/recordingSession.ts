import type {
  RecordedEvent,
  RecordingJourneyCatalogEntry,
  RecordingSession,
  RecordingSessionMetadata,
  RecordingSnapshot,
} from "@/app/recording/recordingTypes";
import {
  isStudioRecModeOnInDom,
  REC_MODE_OFF_REFUSE_MESSAGE,
} from "@/app/recording/studioRecModeDom";
import { ensureQaSessionForRecCapture } from "@/app/shell/requireFreshQaSession";
import {
  isStudioLoggedIn,
  subscribeStudioAuthAudit,
} from "@/app/shell/studioAuthSession";
import { getStudioRelease } from "@/app/shell/studioRelease";
import { CJM_PLAYBACK_CONTRACT_VERSION } from "@/app/recording/recordingContract";

const SESSION_VERSION = 1 as const;
const DEDUPE_WINDOW_MS = 80;
const RECORDING_RECOVERY_STORAGE_KEY = "studioRecordingRecoveryV1";

type RecordingRuntime = {
  activeSession: RecordingSession | null;
  lastSession: RecordingSession | null;
  paused: boolean;
  nextRecordingAuthor: "agent" | "user" | null;
  listeners: Set<() => void>;
  hydrated: boolean;
};

const RECORDING_RUNTIME_KEY = "__studioRecordingRuntimeV1";
const runtimeHost = globalThis as typeof globalThis & {
  [RECORDING_RUNTIME_KEY]?: RecordingRuntime;
};
const runtime = runtimeHost[RECORDING_RUNTIME_KEY] ??= {
  activeSession: null,
  lastSession: null,
  paused: false,
  nextRecordingAuthor: null,
  listeners: new Set<() => void>(),
  hydrated: false,
};

type PersistedRecordingRecovery = {
  active: RecordingSession | null;
  last: RecordingSession | null;
};

function isRestorableSession(value: unknown): value is RecordingSession {
  if (!value || typeof value !== "object") return false;
  const session = value as Partial<RecordingSession>;
  return (
    session.version === SESSION_VERSION &&
    typeof session.id === "string" &&
    typeof session.startedAt === "string" &&
    Array.isArray(session.events)
  );
}

function persistRecordingRecovery(): void {
  if (typeof sessionStorage === "undefined") return;
  try {
    if (!runtime.activeSession && !runtime.lastSession) {
      sessionStorage.removeItem(RECORDING_RECOVERY_STORAGE_KEY);
      return;
    }
    const payload: PersistedRecordingRecovery = {
      active: runtime.activeSession,
      last: runtime.lastSession,
    };
    sessionStorage.setItem(RECORDING_RECOVERY_STORAGE_KEY, JSON.stringify(payload));
  } catch {
    // Storage may be unavailable or full; runtime recording remains authoritative.
  }
}

function hydrateRecordingRecovery(): void {
  if (typeof sessionStorage === "undefined") return;
  try {
    const raw = sessionStorage.getItem(RECORDING_RECOVERY_STORAGE_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw) as Partial<PersistedRecordingRecovery>;
    if (isRestorableSession(parsed.active)) {
      runtime.activeSession = { ...parsed.active, paused: true };
      runtime.paused = true;
    }
    if (isRestorableSession(parsed.last)) runtime.lastSession = parsed.last;
    persistRecordingRecovery();
  } catch {
    try {
      sessionStorage.removeItem(RECORDING_RECOVERY_STORAGE_KEY);
    } catch {
      // Storage can reject both reads and cleanup (privacy mode / denied access).
    }
  }
}

if (!runtime.hydrated) hydrateRecordingRecovery();
runtime.hydrated = true;
if (typeof window !== "undefined" && !runtime.activeSession && !runtime.lastSession) {
  for (const delay of [0, 100, 300]) {
    window.setTimeout(() => {
      if (!runtime.activeSession && !runtime.lastSession) hydrateRecordingRecovery();
    }, delay);
  }
}

subscribeStudioAuthAudit((loggedIn) => {
  if (!runtime.activeSession) return;
  const state = loggedIn ? "user" : "guest";
  const current = runtime.activeSession.metadata?.authStates ?? [];
  if (current.includes(state)) return;
  runtime.activeSession.metadata = {
    ...runtime.activeSession.metadata,
    authStates: [...current, state],
  };
  persistRecordingRecovery();
  notifyRecordingListeners();
});

function notifyRecordingListeners(): void {
  for (const listener of runtime.listeners) {
    listener();
  }
}

/** Subscribe to session start/stop/pause/stage changes (Studio UI + tests). */
export function subscribeRecordingSession(listener: () => void): () => void {
  runtime.listeners.add(listener);
  return () => {
    runtime.listeners.delete(listener);
  };
}

export function getLastRecordingSession(): RecordingSession | null {
  return runtime.lastSession;
}

/** Stage a stopped or imported session for export / replay. */
export function stageRecordingSession(session: RecordingSession): void {
  runtime.lastSession = session;
  persistRecordingRecovery();
  notifyRecordingListeners();
}

function newSessionId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `rec-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function eventDedupeKey(event: RecordedEvent): string {
  switch (event.kind) {
    case "transport":
      return `transport:${event.action}`;
    case "studio":
      return `studio:${event.field}:${String(event.value)}`;
    case "demo-click":
      return `demo-click:${event.element}`;
    case "wire-intent":
      return `wire-intent:${event.intentId}:${JSON.stringify(event.payload ?? {})}`;
    case "scroll":
      return `scroll:${event.anchorSelector ?? ""}:${(event.selectorChain ?? []).join(">")}`;
    case "scroll-stop":
      return `scroll-stop:${event.durationMs}:${event.anchorSelector ?? ""}:${(event.selectorChain ?? []).join(">")}`;
    case "typed-text":
      return `typed-text:${(event.selectorChain ?? []).join(">")}:${event.value}`;
    case "touchpoint":
      return `touchpoint:${event.touchpointKey}`;
    case "dwell":
      return `dwell:${event.durationMs ?? 0}`;
    case "director-script":
      return `director:${event.scriptId}:${event.beatId ?? ""}:${event.manual ? "m" : "a"}`;
    case "beat-enter":
      return `beat-enter:${event.actionId}:${event.beatId ?? ""}`;
    case "screen": {
      // Same screen under cjm/experience churn is one step; modal open/close is not.
      let modal = "";
      if (event.studioUrl) {
        try {
          const raw = event.studioUrl.trim();
          const q = raw.startsWith("?") ? raw.slice(1) : raw;
          modal = new URLSearchParams(q).get("modal")?.trim() ?? "";
        } catch {
          modal = "";
        }
      }
      return `screen:${event.projectId ?? ""}:${event.screenId}:${modal}`;
    }    default:
      return "unknown";
  }
}

function isDuplicate(
  session: RecordingSession,
  event: RecordedEvent
): boolean {
  const last = session.events[session.events.length - 1];
  if (!last) return false;
  if (event.atMs - last.atMs > DEDUPE_WINDOW_MS) return false;
  return eventDedupeKey(last) === eventDedupeKey(event);
}

export function isRecordingActive(): boolean {
  return runtime.activeSession != null && !runtime.paused;
}

/**
 * Journey STEPS for REC UI.
 * - Excludes `scroll` (engine replay targets only).
 * - Includes `scroll-stop` (camera wait / STEPS slot after compile).
 * - Excludes `studio` chrome field flips (not concept steps).
 * - Coalesces demo-click → screen within {@link SCREEN_AFTER_CLICK_MS}
 *   (one user nav action must not count as two STEPS).
 */
const SCREEN_AFTER_CLICK_MS = 1000;

export function countRecordingSteps(
  events: ReadonlyArray<{ kind: string; atMs?: number }> | undefined
): number {
  if (!events?.length) return 0;
  let count = 0;
  let lastDemoClickAt: number | undefined;
  for (const event of events) {
    if (event.kind === "scroll" || event.kind === "studio") continue;

    if (event.kind === "demo-click") {
      if (typeof event.atMs === "number") lastDemoClickAt = event.atMs;
      count += 1;
      continue;
    }

    if (event.kind === "screen") {
      const at = event.atMs;
      if (
        lastDemoClickAt != null &&
        typeof at === "number" &&
        at >= lastDemoClickAt &&
        at - lastDemoClickAt <= SCREEN_AFTER_CLICK_MS
      ) {
        // Screen change is the click's navigation consequence — already counted.
        continue;
      }
      count += 1;
      continue;
    }

    count += 1;
  }
  return count;
}

export function isRecordingPaused(): boolean {
  return runtime.activeSession != null && runtime.paused;
}

export function getActiveRecordingSession(): RecordingSession | null {
  return runtime.activeSession;
}

export type StartRecordingOptions = {
  projectId?: string;
  personaId?: string;
  journeyId?: string;
  orchestraMode?: RecordingSession["orchestraMode"];
  journeyCatalog?: RecordingJourneyCatalogEntry[];
  metadata?: RecordingSessionMetadata;
};

/** Agent-only REC helpers stage provenance before using the same visible Start button. */
export function stageNextRecordingAuthor(author: "agent" | "user"): void {
  runtime.nextRecordingAuthor = author;
}

export function startRecording(options: StartRecordingOptions = {}): RecordingSession {
  // HARD: impossible to arm a session while nav REC switch is OFF.
  // Same DOM truth the PO sees — no silent capture / fake orange frame.
  if (typeof document !== "undefined" && !isStudioRecModeOnInDom()) {
    throw new Error(REC_MODE_OFF_REFUSE_MESSAGE);
  }
  // ALWAYS CLEAR bypass guard — if arm skipped QA reset, force it here.
  if (typeof document !== "undefined") {
    const qa = ensureQaSessionForRecCapture();
    if (qa && !qa.ok) {
      throw new Error(qa.reason ?? "QA overlay required before REC capture");
    }
  }
  const recordedFrom = options.metadata?.recordedFrom ?? "dev";
  const stagedAuthor = runtime.nextRecordingAuthor;
  runtime.nextRecordingAuthor = null;
  const author =
    recordedFrom === "mcp"
      ? "agent"
      : options.metadata?.author ?? stagedAuthor ?? "user";
  runtime.activeSession = {
    id: newSessionId(),
    version: SESSION_VERSION,
    startedAt: new Date().toISOString(),
    projectId: options.projectId,
    personaId: options.personaId,
    journeyId: options.journeyId,
    orchestraMode: options.orchestraMode ?? null,
    journeyCatalog: options.journeyCatalog,
    events: [],
    metadata: {
      userAgent:
        typeof navigator !== "undefined" ? navigator.userAgent : undefined,
      recordedFrom,
      author,
      authStates: [isStudioLoggedIn() ? "user" : "guest"],
      studioVersion: getStudioRelease().version,
      recordingContractVersion: CJM_PLAYBACK_CONTRACT_VERSION,
      ...options.metadata,
      // MCP provenance cannot be downgraded by caller metadata.
      ...(recordedFrom === "mcp" ? { author: "agent" as const } : {}),
    },
  };
  runtime.paused = false;
  persistRecordingRecovery();
  notifyRecordingListeners();
  return runtime.activeSession;
}

export function pauseRecording(): boolean {
  if (!runtime.activeSession) return false;
  runtime.paused = true;
  runtime.activeSession.paused = true;
  persistRecordingRecovery();
  notifyRecordingListeners();
  return true;
}

export function resumeRecording(): boolean {
  if (!runtime.activeSession) return false;
  runtime.paused = false;
  runtime.activeSession.paused = false;
  persistRecordingRecovery();
  notifyRecordingListeners();
  return true;
}

export function stopRecording(): RecordingSession | null {
  if (!runtime.activeSession) return null;
  runtime.activeSession.stoppedAt = new Date().toISOString();
  runtime.activeSession.paused = false;
  const finished = runtime.activeSession;
  runtime.activeSession = null;
  runtime.paused = false;
  runtime.lastSession = finished;
  persistRecordingRecovery();
  notifyRecordingListeners();
  return finished;
}

/**
 * Discard the stopped / staged recording (not a saved CJM).
 * Refuses while a live session is armed — Stop first.
 */
export function clearStagedRecordingSession(): boolean {
  if (runtime.activeSession != null) return false;
  if (runtime.lastSession == null) return false;
  runtime.lastSession = null;
  persistRecordingRecovery();
  notifyRecordingListeners();
  return true;
}

export function appendRecordingEvent(
  event: RecordedEvent,
  options?: { force?: boolean }
): RecordingSession | null {
  if (!runtime.activeSession || runtime.paused) return null;
  if (!options?.force && isDuplicate(runtime.activeSession, event)) {
    return runtime.activeSession;
  }
  runtime.activeSession.events.push(event);
  persistRecordingRecovery();
  // STEPS counter + REC UI subscribe via useSyncExternalStore — must notify.
  notifyRecordingListeners();
  return runtime.activeSession;
}

export function appendRecordingEventWithSnapshot(
  event: Omit<RecordedEvent, "snapshot" | "atMs"> & {
    atMs?: number;
    snapshot?: RecordingSnapshot;
  },
  getSnapshot?: () => RecordingSnapshot | undefined
): RecordingSession | null {
  const full: RecordedEvent = {
    ...event,
    atMs: event.atMs ?? performance.now(),
    snapshot: event.snapshot ?? getSnapshot?.(),
  } as RecordedEvent;
  return appendRecordingEvent(full);
}

export function serializeRecordingSession(
  session: RecordingSession
): string {
  return JSON.stringify(session, null, 2);
}

export function deserializeRecordingSession(raw: string): RecordingSession {
  const parsed = JSON.parse(raw) as RecordingSession;
  if (parsed.version !== SESSION_VERSION) {
    throw new Error(`Unsupported recording version: ${parsed.version}`);
  }
  if (!parsed.id || !Array.isArray(parsed.events)) {
    throw new Error("Invalid recording session payload");
  }
  return parsed;
}

/** Test-only — clears active session state. */
export function resetRecordingSessionForTests(): void {
  runtime.activeSession = null;
  runtime.lastSession = null;
  runtime.paused = false;
  runtime.nextRecordingAuthor = null;
  runtime.listeners.clear();
}
