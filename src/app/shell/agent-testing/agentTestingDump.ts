/**
 * Console dump policy (Arch — PP-10):
 * Save last-N dumps to sessionStorage + downloadable JSON on FAIL or PO alarm.
 * Never dump every step (noise / hang risk). Prefer overlay rows + PLAYBACK_DIAG.
 *
 * PO signal latch (`__studioAgentTestingTakeover` / `__studioConsumePoSignal`)
 * is the **primary** mid-flight path — dumps are secondary persistence/postmortem.
 */

import type { AgentTestingLogEntry } from "@/app/shell/agent-testing/agentTestingTypes";
import type { AgentTestingPoSignal } from "@/app/shell/agent-testing/agentTestingPoSignal";
import { getControlPanelLogEntries } from "@/app/shell/controlPanelLog";
import { getPlaybackDiagBundle } from "@/app/shell/playbackDiag";
import { readAgentTestingSitrep } from "@/app/shell/agent-testing/agentTestingSitrep";

export const AGENT_TESTING_DUMP_KEY = "studioAgentTestingDumps";
export const AGENT_TESTING_DUMP_MAX = 5;
/** Last-N PLAYBACK_DIAG events embedded in dump / alarm payload. */
export const AGENT_TESTING_DUMP_DIAG_EVENTS = 40;

export type AgentTestingDumpReason =
  | "fail"
  | "alarm"
  | "cursor"
  | "scroll"
  | "manual";

export type AgentTestingDump = {
  atIso: string;
  reason: AgentTestingDumpReason;
  /** Explicit machine code — Alarm = ALARM_SEQUENCE_MISMATCH. */
  code?: string;
  title: string;
  elapsedMs: number;
  sitrepLine?: string;
  currentBeat?: {
    beatId?: string | null;
    counter?: string | null;
    screenId?: string | null;
    touchpointKey?: string | null;
  };
  timeline?: Array<{ key: string; outcome: string }>;
  recentPlaybackDiagEvents?: unknown[];
  summaries?: {
    typeIn?: {
      starts: number;
      ends: number;
      skips: number;
      samples: number;
    };
    scroll?: { events: number; retreatIntoView: number };
    cursor?: {
      events: number;
      parks: number;
      lastParkReason: string | null;
    };
    click?: { ok: number; fail: number };
  };
  /** Copy of live latch at dump time (if any). */
  poSignal?: AgentTestingPoSignal | null;
  log: Array<{
    time: string;
    label: string;
    outcome: string;
    count?: number;
    durationMs?: number;
  }>;
  playbackDiag?: unknown;
  cursorDiag?: unknown;
  controlPanel?: unknown;
};

function safeJsonParse(raw: string | null): AgentTestingDump[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (d): d is AgentTestingDump =>
        !!d && typeof d === "object" && typeof (d as AgentTestingDump).atIso === "string"
    );
  } catch {
    return [];
  }
}

export function readAgentTestingDumps(): AgentTestingDump[] {
  try {
    return safeJsonParse(sessionStorage.getItem(AGENT_TESTING_DUMP_KEY));
  } catch {
    return [];
  }
}

export function pushAgentTestingDump(dump: AgentTestingDump): AgentTestingDump[] {
  const next = [dump, ...readAgentTestingDumps()].slice(0, AGENT_TESTING_DUMP_MAX);
  try {
    sessionStorage.setItem(AGENT_TESTING_DUMP_KEY, JSON.stringify(next));
  } catch {
    /* private mode / quota */
  }
  return next;
}

function reasonDefaultCode(reason: AgentTestingDumpReason): string | undefined {
  if (reason === "alarm") return "ALARM_SEQUENCE_MISMATCH";
  if (reason === "cursor") return "CURSOR_WEIRD_FLAG";
  if (reason === "scroll") return "SCROLL_ISSUE_REPORTED";
  return undefined;
}

export function buildAgentTestingDump(options: {
  reason: AgentTestingDumpReason;
  title: string;
  elapsedMs: number;
  sitrepLine?: string;
  log: AgentTestingLogEntry[];
  code?: string;
  timeline?: Array<{ key: string; outcome: string }>;
  poSignal?: AgentTestingPoSignal | null;
}): AgentTestingDump {
  let playbackDiag: unknown;
  let cursorDiag: unknown;
  let controlPanel: unknown;
  let recentPlaybackDiagEvents: unknown[] | undefined;
  let summaries: AgentTestingDump["summaries"];
  try {
    playbackDiag =
      typeof window !== "undefined"
        ? window.__studioPlaybackDiag?.() ?? window.__protoPlaybackDiag?.()
        : undefined;
  } catch {
    playbackDiag = { error: "playbackDiag unavailable" };
  }
  try {
    const bundle = getPlaybackDiagBundle();
    recentPlaybackDiagEvents = bundle.events.slice(
      -AGENT_TESTING_DUMP_DIAG_EVENTS
    );
    summaries = {
      typeIn: {
        starts: bundle.typeIn.starts,
        ends: bundle.typeIn.ends,
        skips: bundle.typeIn.skips,
        samples: bundle.typeIn.progressSamples.length,
      },
      scroll: {
        events: bundle.scroll.events,
        retreatIntoView: bundle.scroll.retreatIntoView,
      },
      cursor: {
        events: bundle.cursor.events,
        parks: bundle.cursor.parks,
        lastParkReason: bundle.cursor.lastParkReason,
      },
      click: {
        ok: bundle.click.ok,
        fail: bundle.click.fail,
      },
    };
  } catch {
    recentPlaybackDiagEvents = undefined;
    summaries = undefined;
  }
  try {
    cursorDiag =
      typeof window !== "undefined"
        ? window.__studioCursorDiagnostics?.() ??
          window.__protoCursorDiagnostics?.()
        : undefined;
  } catch {
    cursorDiag = { error: "cursorDiag unavailable" };
  }
  try {
    controlPanel = getControlPanelLogEntries();
  } catch {
    controlPanel = { error: "controlPanel unavailable" };
  }

  const sitrep = readAgentTestingSitrep();

  return {
    atIso: new Date().toISOString(),
    reason: options.reason,
    code: options.code ?? reasonDefaultCode(options.reason),
    title: options.title,
    elapsedMs: options.elapsedMs,
    sitrepLine: options.sitrepLine ?? sitrep.line,
    currentBeat: {
      beatId: sitrep.beat ?? null,
      counter: sitrep.counter ?? null,
      screenId: sitrep.screenId ?? null,
      touchpointKey: sitrep.touchpointKey ?? null,
    },
    timeline: options.timeline,
    recentPlaybackDiagEvents,
    summaries,
    poSignal: options.poSignal ?? null,
    log: options.log.map((e) => ({
      time: e.timeLabel,
      label: e.label,
      outcome: e.outcome,
      count: e.count,
      durationMs: e.durationMs,
    })),
    playbackDiag,
    cursorDiag,
    controlPanel,
  };
}

/** Download latest (or provided) dump as JSON — hang-safe. Secondary to live latch. */
export function downloadAgentTestingDump(dump?: AgentTestingDump): boolean {
  if (typeof document === "undefined") return false;
  const payload = dump ?? readAgentTestingDumps()[0];
  if (!payload) return false;
  try {
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `agent-testing-dump-${payload.reason}-${payload.atIso.replace(/[:.]/g, "-")}.json`;
    a.rel = "noopener";
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    return true;
  } catch {
    return false;
  }
}

export function consoleSeparator(phase: "START" | "END", title: string): void {
  const bar = "═".repeat(24);
  const line = `${bar} AGENT TEST ${phase}: ${title} ${bar}`;
  try {
    if (phase === "START") {
      console.log(`%c${line}`, "color:#9ee6c0;font-weight:700");
    } else {
      console.log(`%c${line}`, "color:#ffb3b3;font-weight:700");
    }
  } catch {
    /* ignore */
  }
}
