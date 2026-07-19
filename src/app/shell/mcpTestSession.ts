/**
 * Shared MCP test session wrapper — overlay + cursor eyes + abort guard.
 */

import {
  logAgentTestingOverlay,
  startAgentTestingOverlay,
  stopAgentTestingOverlay,
} from "@/app/shell/agentTestingOverlay";
import {
  beginMcpTestSession,
  endMcpTestSession,
  getMcpTestSession,
  requestMcpTestAbort,
} from "@/app/shell/mcpTestGuard";
import {
  disableCursorQaEyes,
  enableCursorQaEyes,
} from "@/app/shell/playbackCursorDiagnostic";

export function mcpDelay(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

export async function withMcpTestSession<T>(
  label: string,
  run: () => Promise<T>,
  sessionOptions?: { resetToHub?: boolean }
): Promise<T> {
  const prior = getMcpTestSession();
  if (prior) {
    requestMcpTestAbort("superseded");
    endMcpTestSession(prior.id);
  }
  const id = beginMcpTestSession(label);
  enableCursorQaEyes();
  startAgentTestingOverlay(`AGENT TESTING — ${label}`);
  logAgentTestingOverlay(`session: ${label}`);
  try {
    return await run();
  } finally {
    // Journey/CJM: resetToHub true. Page probes / sanity: stay on screen.
    stopAgentTestingOverlay({
      reload: true,
      resetToHub: sessionOptions?.resetToHub === true,
    });
    disableCursorQaEyes();
    endMcpTestSession(id);
  }
}
