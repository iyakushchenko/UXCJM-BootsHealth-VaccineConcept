/**
 * @vitest-environment happy-dom
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  armMcpPendingTimeout,
  beginMcpConnecting,
  clearMcpPending,
  deriveMcpConnectionStatus,
  formatMcpStatusLabel,
  registerMcpPendingTimeoutHandler,
  reportMcpConnectionError,
  resetMcpStatusForTests,
} from "@/app/shell/agent-testing/agentTestingMcpStatus";

describe("agentTestingMcpStatus", () => {
  beforeEach(() => {
    resetMcpStatusForTests();
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
    resetMcpStatusForTests();
  });

  it("formats labels", () => {
    expect(formatMcpStatusLabel("control")).toBe("MCP — CONTROL");
    expect(formatMcpStatusLabel("observe")).toBe("MCP — OBSERVE");
    expect(formatMcpStatusLabel("pending")).toBe("MCP — CONTROL · PENDING");
    expect(formatMcpStatusLabel("error", "timeout")).toBe("MCP — ERROR: timeout");
  });

  it("derives CONTROL / OBSERVE / PENDING from session", () => {
    expect(
      deriveMcpConnectionStatus({
        overlayActive: true,
        sessionKind: "agent",
        awaitingReply: false,
        now: 1_000_000,
      }).phase
    ).toBe("control");
    expect(
      deriveMcpConnectionStatus({
        overlayActive: true,
        sessionKind: "observe",
        awaitingReply: false,
        now: 1_000_000,
      }).phase
    ).toBe("observe");
    expect(
      deriveMcpConnectionStatus({
        overlayActive: true,
        sessionKind: "agent",
        awaitingReply: true,
        now: 1_000_000,
      }).phase
    ).toBe("pending");
  });

  it("CONNECTING flash then settles", () => {
    beginMcpConnecting();
    const connecting = deriveMcpConnectionStatus({
      overlayActive: true,
      sessionKind: "agent",
      awaitingReply: false,
      now: Date.now(),
    });
    expect(connecting.phase).toBe("connecting");
    vi.advanceTimersByTime(900);
    const settled = deriveMcpConnectionStatus({
      overlayActive: true,
      sessionKind: "agent",
      awaitingReply: false,
      now: Date.now(),
    });
    expect(settled.phase).toBe("control");
  });

  it("pending timeout fires handler", () => {
    const fn = vi.fn();
    registerMcpPendingTimeoutHandler(fn);
    (window as Window & { __studioQaPendingTimeoutMs?: number }).__studioQaPendingTimeoutMs = 50;
    armMcpPendingTimeout();
    expect(fn).not.toHaveBeenCalled();
    vi.advanceTimersByTime(60);
    expect(fn).toHaveBeenCalledTimes(1);
    clearMcpPending();
    delete (window as Window & { __studioQaPendingTimeoutMs?: number })
      .__studioQaPendingTimeoutMs;
  });

  it("ERROR phase", () => {
    reportMcpConnectionError("latch fail");
    expect(
      deriveMcpConnectionStatus({
        overlayActive: true,
        sessionKind: "agent",
        awaitingReply: false,
      }).label
    ).toBe("MCP — ERROR: latch fail");
  });
});
