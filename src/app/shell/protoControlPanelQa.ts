import {
  logControlPanel,
  type ControlPanelLogEntry,
} from "@/app/shell/protoControlPanelLog";

export type QaHudState = {
  phase: string;
  detail: string;
  pass: number;
  fail: number;
  lastCheck: string;
  lastCursor: string;
  cursorAction: string;
  cursorTarget: string;
  cursorBeatId: string;
  running: boolean;
  updatedAt: number;
};

const DEFAULT_HUD: QaHudState = {
  phase: "idle",
  detail: "",
  pass: 0,
  fail: 0,
  lastCheck: "",
  lastCursor: "",
  cursorAction: "",
  cursorTarget: "",
  cursorBeatId: "",
  running: false,
  updatedAt: 0,
};

let hudState: QaHudState = { ...DEFAULT_HUD };
const listeners = new Set<() => void>();

function emitHud() {
  hudState = { ...hudState, updatedAt: Date.now() };
  if (typeof window !== "undefined") {
    window.__protoQaHud = hudState;
  }
  listeners.forEach((listener) => listener());
}

export function getQaHudState(): QaHudState {
  return hudState;
}

export function subscribeQaHud(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function resetQaHud(): void {
  hudState = { ...DEFAULT_HUD };
  emitHud();
}

export function publishQaHud(partial: Partial<QaHudState>): void {
  hudState = { ...hudState, ...partial };
  emitHud();
}

export function logQaPhase(phase: string, detail?: string): void {
  logControlPanel("qa:phase", { phase, detail });
  publishQaHud({ phase, detail: detail ?? "" });
}

export function logQaCheck(
  id: string,
  pass: boolean,
  detail?: Record<string, unknown>
): void {
  logControlPanel("qa:check", { id, pass, ...detail });
  publishQaHud({
    lastCheck: `${pass ? "PASS" : "FAIL"} ${id}`,
    pass: hudState.pass + (pass ? 1 : 0),
    fail: hudState.fail + (pass ? 0 : 1),
  });
}

export function logQaCursor(
  detail: Record<string, unknown> & { summary?: string }
): void {
  const { summary, ...rest } = detail;
  logControlPanel("qa:cursor", rest);
  const action = String(rest.action ?? "");
  const target = String(rest.target ?? "");
  const beatId = String(rest.beatId ?? "");
  const compact =
    summary ??
    [action, beatId, target.replace(/^<[^>]+>\s*/, "").slice(0, 32)]
      .filter(Boolean)
      .join(" · ");
  publishQaHud({
    lastCursor: compact,
    cursorAction: action,
    cursorTarget: target,
    cursorBeatId: beatId,
  });
}

export function getRecentQaLog(limit = 8): ControlPanelLogEntry[] {
  const log = window.__protoControlPanelLog ?? [];
  return log.filter((entry) => entry.action.startsWith("qa:")).slice(-limit);
}

export function getRecentCursorQaLog(limit = 8): ControlPanelLogEntry[] {
  const log = window.__protoControlPanelLog ?? [];
  return log.filter((entry) => entry.action === "qa:cursor").slice(-limit);
}

declare global {
  interface Window {
    __protoQaHud?: QaHudState;
  }
}
