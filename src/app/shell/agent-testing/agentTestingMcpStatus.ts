/**
 * MCP connection status for the QA overlay — derived from sessionKind + latches.
 * No parallel mode soup: CONTROL ↔ agent, OBSERVE ↔ observe, PENDING ↔ awaiting reply.
 *
 * PENDING timeout (default 60s): auto-pause capture + log line; clear PENDING.
 * Override: `window.__studioQaPendingTimeoutMs` (prove / tests).
 */

import type { AgentTestingSessionKind } from "@/app/shell/agent-testing/agentTestingSession";

export type McpConnectionPhase =
  | "idle"
  | "connecting"
  | "connected"
  | "control"
  | "observe"
  | "pending"
  | "error";

export type McpConnectionStatus = {
  phase: McpConnectionPhase;
  /** e.g. `MCP — CONTROL` / `MCP — CONTROL · PENDING` */
  label: string;
  error?: string;
  pendingDeadlineAt?: number | null;
  pendingMsLeft?: number | null;
};

type McpMemory = {
  connectingUntil: number;
  connectedUntil: number;
  error: string | null;
  pendingDeadlineAt: number | null;
  pendingTimer: ReturnType<typeof setTimeout> | null;
};

const MEMORY_KEY = "__studioQaMcpStatusMemory";
const DEFAULT_PENDING_MS = 60_000;
const CONNECTING_FLASH_MS = 280;
const CONNECTED_FLASH_MS = 500;

type PendingTimeoutHandler = () => void;

let pendingTimeoutHandler: PendingTimeoutHandler | null = null;

function memory(): McpMemory {
  if (typeof window === "undefined") {
    const g = globalThis as typeof globalThis & { [MEMORY_KEY]?: McpMemory };
    if (!g[MEMORY_KEY]) {
      g[MEMORY_KEY] = {
        connectingUntil: 0,
        connectedUntil: 0,
        error: null,
        pendingDeadlineAt: null,
        pendingTimer: null,
      };
    }
    return g[MEMORY_KEY]!;
  }
  const w = window as Window & { [MEMORY_KEY]?: McpMemory };
  if (!w[MEMORY_KEY]) {
    w[MEMORY_KEY] = {
      connectingUntil: 0,
      connectedUntil: 0,
      error: null,
      pendingDeadlineAt: null,
      pendingTimer: null,
    };
  }
  return w[MEMORY_KEY]!;
}

export function getQaPendingTimeoutMs(): number {
  if (typeof window !== "undefined") {
    const raw = (window as Window & { __studioQaPendingTimeoutMs?: number })
      .__studioQaPendingTimeoutMs;
    if (typeof raw === "number" && Number.isFinite(raw) && raw >= 0) {
      return Math.round(raw);
    }
  }
  return DEFAULT_PENDING_MS;
}

export function registerMcpPendingTimeoutHandler(
  handler: PendingTimeoutHandler | null
): void {
  pendingTimeoutHandler = handler;
}

function clearPendingTimerOnly(): void {
  const m = memory();
  if (m.pendingTimer != null) {
    clearTimeout(m.pendingTimer);
    m.pendingTimer = null;
  }
  m.pendingDeadlineAt = null;
}

/** Clear PENDING latch + timer (user replied or session ended). */
export function clearMcpPending(): void {
  clearPendingTimerOnly();
}

/**
 * Start PENDING countdown. On timeout → handler (overlay: pause + log).
 * Idempotent restart when already pending.
 */
export function armMcpPendingTimeout(): void {
  const m = memory();
  clearPendingTimerOnly();
  const ms = getQaPendingTimeoutMs();
  m.pendingDeadlineAt = Date.now() + ms;
  if (ms <= 0) {
    // Immediate prove path
    try {
      pendingTimeoutHandler?.();
    } catch {
      /* hang-safe */
    }
    return;
  }
  m.pendingTimer = setTimeout(() => {
    m.pendingTimer = null;
    m.pendingDeadlineAt = null;
    try {
      pendingTimeoutHandler?.();
    } catch {
      /* hang-safe */
    }
  }, ms);
}

/** Agent/MCP latch starting → CONNECTING flash. */
export function beginMcpConnecting(): void {
  const m = memory();
  m.error = null;
  const now = Date.now();
  m.connectingUntil = now + CONNECTING_FLASH_MS;
  m.connectedUntil = now + CONNECTING_FLASH_MS + CONNECTED_FLASH_MS;
}

/** Force CONNECTED flash then settle (optional explicit call). */
export function flashMcpConnected(): void {
  const m = memory();
  m.error = null;
  m.connectingUntil = 0;
  m.connectedUntil = Date.now() + CONNECTED_FLASH_MS;
}

export function reportMcpConnectionError(detail: string): void {
  const m = memory();
  m.error = detail.trim() || "connection failed";
  m.connectingUntil = 0;
  m.connectedUntil = 0;
  clearPendingTimerOnly();
}

export function clearMcpConnectionError(): void {
  memory().error = null;
}

/** Clear connecting/connected flashes (idle / force-clear). */
export function resetMcpStatusLatches(): void {
  clearPendingTimerOnly();
  const m = memory();
  m.connectingUntil = 0;
  m.connectedUntil = 0;
  m.error = null;
}

export function formatMcpStatusLabel(
  phase: McpConnectionPhase,
  error?: string | null
): string {
  switch (phase) {
    case "connecting":
      return "MCP — CONNECTING";
    case "connected":
      return "MCP — CONNECTED";
    case "control":
      return "MCP — CONTROL";
    case "observe":
      return "MCP — OBSERVE";
    case "pending":
      return "MCP — CONTROL · PENDING";
    case "error":
      return `MCP — ERROR: ${error?.trim() || "unknown"}`;
    default:
      return "";
  }
}

export type DeriveMcpStatusInput = {
  overlayActive: boolean;
  sessionKind: AgentTestingSessionKind;
  awaitingReply: boolean;
  now?: number;
};

/** Derive phase from session + latches (SSoT display). */
export function deriveMcpConnectionStatus(
  input: DeriveMcpStatusInput
): McpConnectionStatus {
  const m = memory();
  const now = input.now ?? Date.now();

  if (m.error) {
    return {
      phase: "error",
      label: formatMcpStatusLabel("error", m.error),
      error: m.error,
      pendingDeadlineAt: null,
      pendingMsLeft: null,
    };
  }

  if (!input.overlayActive) {
    return {
      phase: "idle",
      label: "",
      pendingDeadlineAt: null,
      pendingMsLeft: null,
    };
  }

  // Manual free-form logger — no MCP online
  if (input.sessionKind === "manual" && !input.awaitingReply) {
    if (now < m.connectingUntil) {
      return {
        phase: "connecting",
        label: formatMcpStatusLabel("connecting"),
        pendingDeadlineAt: null,
        pendingMsLeft: null,
      };
    }
    return {
      phase: "idle",
      label: "",
      pendingDeadlineAt: null,
      pendingMsLeft: null,
    };
  }

  if (now < m.connectingUntil) {
    return {
      phase: "connecting",
      label: formatMcpStatusLabel("connecting"),
      pendingDeadlineAt: m.pendingDeadlineAt,
      pendingMsLeft: m.pendingDeadlineAt
        ? Math.max(0, m.pendingDeadlineAt - now)
        : null,
    };
  }

  if (now < m.connectedUntil) {
    return {
      phase: "connected",
      label: formatMcpStatusLabel("connected"),
      pendingDeadlineAt: m.pendingDeadlineAt,
      pendingMsLeft: m.pendingDeadlineAt
        ? Math.max(0, m.pendingDeadlineAt - now)
        : null,
    };
  }

  if (input.awaitingReply || m.pendingDeadlineAt != null) {
    const pendingMsLeft = m.pendingDeadlineAt
      ? Math.max(0, m.pendingDeadlineAt - now)
      : null;
    return {
      phase: "pending",
      label: formatMcpStatusLabel("pending"),
      pendingDeadlineAt: m.pendingDeadlineAt,
      pendingMsLeft,
    };
  }

  if (input.sessionKind === "observe") {
    return {
      phase: "observe",
      label: formatMcpStatusLabel("observe"),
      pendingDeadlineAt: null,
      pendingMsLeft: null,
    };
  }

  if (input.sessionKind === "agent") {
    return {
      phase: "control",
      label: formatMcpStatusLabel("control"),
      pendingDeadlineAt: null,
      pendingMsLeft: null,
    };
  }

  return {
    phase: "idle",
    label: "",
    pendingDeadlineAt: null,
    pendingMsLeft: null,
  };
}

/** Public helper snapshot. */
export function readMcpConnectionStatus(input: DeriveMcpStatusInput): McpConnectionStatus {
  return deriveMcpConnectionStatus(input);
}

export function resetMcpStatusForTests(): void {
  resetMcpStatusLatches();
  pendingTimeoutHandler = null;
}
