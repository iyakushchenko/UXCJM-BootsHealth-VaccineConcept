/**
 * QA listen DOM + pause helpers (extracted from overlay for hygiene).
 * Overlay supplies session mutators via deps — hang-safe.
 */

import type { PlaybackDiagnosticError } from "@/app/shell/playbackDiagnostic";
import { getOpenDiagnosticFlash } from "@/app/shell/playbackDiagnosticFlash";
import { latchPoSignal } from "@/app/shell/agent-testing/agentTestingPoSignal";
import { haltPlaybackForPoSignal } from "@/app/shell/agent-testing/agentTestingPlaybackHalt";
import { bumpMcpPendingForUserTyping } from "@/app/shell/agent-testing/agentTestingMcpStatus";
import { isAwaitingUserReply } from "@/app/shell/agent-testing/agentTestingSession";
import type { AgentTestingTimelineKey } from "@/app/shell/agent-testing/agentTestingTypes";
import {
  readQaMessageDraft,
  shouldBlockQaPlay,
  writeQaMessageDraft,
} from "@/app/shell/agent-testing/agentTestingListen";

export type QaListenLogEntry = {
  atMs: number;
  timeLabel: string;
  label: string;
  outcome: "ok" | "soft-fail" | "fail";
  kind: string;
};

export type QaListenDeps = {
  rootId: string;
  isActive: () => boolean;
  isSettling: () => boolean;
  getCapturePaused: () => boolean;
  setCapturePaused: (v: boolean) => void;
  setSessionHadProgress: (v: boolean) => void;
  getDiagnosticBlocking: () => boolean;
  setDiagnosticBlocking: (v: boolean) => void;
  getLastSitrepLine: () => string;
  getTimelineKeys: () => AgentTestingTimelineKey[];
  pushLogEntry: (e: QaListenLogEntry) => void;
  pauseElapsedClock: () => void;
  armElapsedTimer: () => void;
  setActivityPhase: (phase: string, detail?: string) => void;
  syncCaptureWatch: () => void;
  syncSessionChrome: () => void;
  getLastUserTypingLogAt: () => number;
  setLastUserTypingLogAt: (v: number) => void;
  getLastBlockedPlayLogAt: () => number;
  setLastBlockedPlayLogAt: (v: number) => void;
};

export function pauseCaptureAndHalt(
  deps: QaListenDeps,
  reason: string,
  logLabel: string
): void {
  try {
    haltPlaybackForPoSignal(reason);
  } catch {
    /* hang-safe */
  }
  if (!deps.isActive() || deps.isSettling()) return;
  if (!deps.getCapturePaused()) {
    deps.pauseElapsedClock();
    deps.setCapturePaused(true);
    deps.setSessionHadProgress(true);
  }
  deps.pushLogEntry({
    atMs: Date.now(),
    timeLabel: new Date().toLocaleTimeString("en-GB", { hour12: false }),
    label: logLabel,
    outcome:
      reason.includes("diag") || reason.includes("hmr") ? "soft-fail" : "ok",
    kind: "system",
  });
  deps.setActivityPhase("paused", reason);
  deps.armElapsedTimer();
  deps.syncCaptureWatch();
  deps.syncSessionChrome();
}

export function isDiagnosticOpenNow(deps: QaListenDeps): boolean {
  try {
    return Boolean(getOpenDiagnosticFlash()) || deps.getDiagnosticBlocking();
  } catch {
    return deps.getDiagnosticBlocking();
  }
}

export function shouldBlockPlayNow(deps: QaListenDeps): boolean {
  return shouldBlockQaPlay({
    overlayActive: deps.isActive() && !deps.isSettling(),
    capturePaused: deps.getCapturePaused(),
    diagnosticOpen: isDiagnosticOpenNow(deps),
  });
}

export function noteBlockedPlayAttempt(deps: QaListenDeps): void {
  const now = Date.now();
  if (now - deps.getLastBlockedPlayLogAt() < 1200) return;
  deps.setLastBlockedPlayLogAt(now);
  const why = isDiagnosticOpenNow(deps)
    ? "Play ignored — playback diagnostic open (Ack/consume first)"
    : "Play ignored — QA Pause (Resume first)";
  deps.pushLogEntry({
    atMs: now,
    timeLabel: new Date().toLocaleTimeString("en-GB", { hour12: false }),
    label: why,
    outcome: "soft-fail",
    kind: "system",
  });
}

export function onPlaybackDiagnosticOpened(
  deps: QaListenDeps,
  error: PlaybackDiagnosticError
): void {
  deps.setDiagnosticBlocking(true);
  pauseCaptureAndHalt(
    deps,
    "diagnostic-open",
    `control-room · Alarm red / diagnostic — ${
      error.message.length > 80
        ? `${error.message.slice(0, 78)}…`
        : error.message
    }`
  );
  try {
    latchPoSignal({
      type: "diagnostic",
      code: "PLAYBACK_DIAGNOSTIC_OPEN",
      note: error.message,
      sitrepLine: deps.getLastSitrepLine(),
      timeline: deps.getTimelineKeys(),
    });
  } catch {
    /* hang-safe */
  }
}

export function focusMessageInput(
  rootId: string,
  root?: HTMLElement | null
): void {
  try {
    const el =
      root?.querySelector<HTMLInputElement>(
        ".studio-agent-testing-overlay__note-input"
      ) ??
      document
        .getElementById(rootId)
        ?.querySelector<HTMLInputElement>(
          ".studio-agent-testing-overlay__note-input"
        );
    if (!el) return;
    const draft = readQaMessageDraft();
    if (draft && !el.value) el.value = draft;
    window.setTimeout(() => {
      try {
        el.focus({ preventScroll: true });
      } catch {
        /* ignore */
      }
    }, 0);
  } catch {
    /* hang-safe */
  }
}

export function bindMessageListen(
  deps: QaListenDeps,
  root: HTMLElement
): void {
  const input = root.querySelector<HTMLInputElement>(
    ".studio-agent-testing-overlay__note-input"
  );
  if (!input || input.dataset.listenBound === "1") return;
  input.dataset.listenBound = "1";
  const draft = readQaMessageDraft();
  if (draft) input.value = draft;

  const onTyping = () => {
    writeQaMessageDraft(input.value ?? "");
    if (!isAwaitingUserReply()) return;
    const bumped = bumpMcpPendingForUserTyping();
    if (!bumped) return;
    const now = Date.now();
    if (now - deps.getLastUserTypingLogAt() < 2500) return;
    deps.setLastUserTypingLogAt(now);
    deps.pushLogEntry({
      atMs: now,
      timeLabel: new Date().toLocaleTimeString("en-GB", { hour12: false }),
      label: "user-typing · PENDING wait extended",
      outcome: "ok",
      kind: "system",
    });
    try {
      const w = window as Window & {
        __studioAgentTestingUserTyping?: { at: number; pending: true };
      };
      w.__studioAgentTestingUserTyping = { at: now, pending: true };
    } catch {
      /* ignore */
    }
  };

  input.addEventListener("input", onTyping);
  input.addEventListener("focus", onTyping);
}

export function installViteHmrListen(deps: QaListenDeps): void {
  try {
    const hot = (
      import.meta as ImportMeta & {
        hot?: { on: (event: string, cb: () => void) => void };
      }
    ).hot;
    if (!hot || typeof hot.on !== "function") return;
    hot.on("vite:beforeUpdate", () => {
      if (!deps.isActive() || deps.isSettling()) return;
      pauseCaptureAndHalt(
        deps,
        "vite-hmr",
        "vite-hmr · capture/play paused (hot invalidate)"
      );
    });
  } catch {
    /* follow-up if HMR API unavailable */
  }
}

export function maybeLogMcpPhaseChange(
  deps: QaListenDeps,
  input: {
    phase: string;
    label?: string;
    lastLoggedPhase: string;
    setLastLoggedPhase: (p: string) => void;
  }
): void {
  const phase = input.phase ?? "";
  if (
    deps.isActive() &&
    phase &&
    phase !== "idle" &&
    phase !== input.lastLoggedPhase
  ) {
    const prev = input.lastLoggedPhase || "—";
    input.setLastLoggedPhase(phase);
    const outcome =
      phase === "error" ? "fail" : phase === "pending" ? "soft-fail" : "ok";
    deps.pushLogEntry({
      atMs: Date.now(),
      timeLabel: new Date().toLocaleTimeString("en-GB", { hour12: false }),
      label: `MCP · ${prev} → ${phase.toUpperCase()}${
        input.label ? ` (${input.label})` : ""
      }`,
      outcome,
      kind: "system",
    });
    if (phase === "error") {
      try {
        latchPoSignal({
          type: "mcp",
          code: "MCP_PHASE_CHANGE",
          note: input.label || "MCP ERROR",
          sitrepLine: deps.getLastSitrepLine(),
        });
      } catch {
        /* hang-safe */
      }
    }
  } else if (phase === "idle") {
    input.setLastLoggedPhase("");
  }
  try {
    if (deps.getDiagnosticBlocking() && !getOpenDiagnosticFlash()) {
      deps.setDiagnosticBlocking(false);
    }
  } catch {
    /* ignore */
  }
}
