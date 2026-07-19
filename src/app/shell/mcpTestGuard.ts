/** Guards MCP / smoke / robot QA — one session at a time, abortable. */

let sessionId = 0;
let activeSession: { id: number; label: string } | null = null;
let abortRequested = false;

export function isMcpTestAborted(): boolean {
  return abortRequested;
}

export function getMcpTestSession(): { id: number; label: string } | null {
  return activeSession;
}

export function requestMcpTestAbort(reason = "user"): void {
  abortRequested = true;
  if (typeof window !== "undefined") {
    window.__protoMcpTestAborted = true;
    window.__protoMcpAbortReason = reason;
  }
}

export function clearMcpTestAbort(): void {
  abortRequested = false;
  if (typeof window !== "undefined") {
    window.__protoMcpTestAborted = false;
    window.__protoMcpAbortReason = undefined;
  }
}

/** Start a guarded MCP test — rejects if another session is active. */
export function beginMcpTestSession(label: string): number {
  if (activeSession != null) {
    throw new Error(
      `MCP test already running: ${activeSession.label} — call __protoAbortAll() first`
    );
  }
  clearMcpTestAbort();
  const id = ++sessionId;
  activeSession = { id, label };
  if (typeof window !== "undefined") {
    window.__protoMcpTestSession = activeSession;
  }
  return id;
}

export function endMcpTestSession(id: number): void {
  if (activeSession?.id === id) {
    activeSession = null;
    if (typeof window !== "undefined") {
      window.__protoMcpTestSession = null;
    }
  }
  clearMcpTestAbort();
}

export function throwIfMcpTestAborted(): void {
  if (abortRequested) {
    throw new Error("MCP test aborted");
  }
}

declare global {
  interface Window {
    __protoMcpTestAborted?: boolean;
    __protoMcpAbortReason?: string;
    __protoMcpTestSession?: { id: number; label: string } | null;
  }
}
