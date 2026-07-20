/**
 * @vitest-environment happy-dom
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  armMcpPendingTimeout,
  beginMcpConnecting,
  clearMcpPending,
  deriveMcpConnectionStatus,
  flashMcpConnected,
  formatMcpStatusLabel,
  registerMcpPendingTimeoutHandler,
  reportMcpConnectionError,
  resetMcpStatusForTests,
  resetMcpStatusLatches,
} from "@/app/shell/agent-testing/agentTestingMcpStatus";

describe("agentTestingMcpStatus", () => {
  beforeEach(() => {
    resetMcpStatusForTests();
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
    resetMcpStatusForTests();
    delete (window as Window & { __studioQaPendingTimeoutMs?: number })
      .__studioQaPendingTimeoutMs;
  });

  it("formats labels", () => {
    expect(formatMcpStatusLabel("control")).toBe("AGENT — CONTROL");
    expect(formatMcpStatusLabel("control", null, "playback")).toBe(
      "AGENT — CONTROL · PLAYBACK"
    );
    expect(formatMcpStatusLabel("control", null, "manual")).toBe(
      "AGENT — CONTROL · MANUAL"
    );
    expect(formatMcpStatusLabel("observe")).toBe("AGENT — OBSERVE");
    expect(formatMcpStatusLabel("pending")).toBe("AGENT — CONTROL · PENDING");
    expect(formatMcpStatusLabel("pending", null, "playback")).toBe(
      "AGENT — CONTROL · PENDING · PLAYBACK"
    );
    expect(formatMcpStatusLabel("error", "timeout")).toBe(
      "AGENT — ERROR: timeout"
    );
    expect(formatMcpStatusLabel("idle")).toBe("");
    expect(formatMcpStatusLabel("connecting")).toBe("AGENT — STARTING");
    expect(formatMcpStatusLabel("connected")).toBe("AGENT — READY");
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

  it("idle when overlay inactive or manual without latch", () => {
    expect(
      deriveMcpConnectionStatus({
        overlayActive: false,
        sessionKind: "agent",
        awaitingReply: false,
        now: 1_000_000,
      }).phase
    ).toBe("idle");
    expect(
      deriveMcpConnectionStatus({
        overlayActive: true,
        sessionKind: "manual",
        awaitingReply: false,
        now: 1_000_000,
      }).phase
    ).toBe("idle");
  });

  it("CONNECTING flash then CONNECTED then settles CONTROL", () => {
    beginMcpConnecting();
    const t0 = Date.now();
    expect(
      deriveMcpConnectionStatus({
        overlayActive: true,
        sessionKind: "agent",
        awaitingReply: false,
        now: t0,
      }).phase
    ).toBe("connecting");
    vi.advanceTimersByTime(300);
    expect(
      deriveMcpConnectionStatus({
        overlayActive: true,
        sessionKind: "agent",
        awaitingReply: false,
        now: Date.now(),
      }).phase
    ).toBe("connected");
    vi.advanceTimersByTime(600);
    expect(
      deriveMcpConnectionStatus({
        overlayActive: true,
        sessionKind: "agent",
        awaitingReply: false,
        now: Date.now(),
      }).phase
    ).toBe("control");
  });

  it("flashMcpConnected skips connecting", () => {
    flashMcpConnected();
    expect(
      deriveMcpConnectionStatus({
        overlayActive: true,
        sessionKind: "agent",
        awaitingReply: false,
        now: Date.now(),
      }).phase
    ).toBe("connected");
  });

  it("pending timeout fires handler once", () => {
    const fn = vi.fn();
    registerMcpPendingTimeoutHandler(fn);
    (
      window as Window & { __studioQaPendingTimeoutMs?: number }
    ).__studioQaPendingTimeoutMs = 50;
    armMcpPendingTimeout();
    expect(fn).not.toHaveBeenCalled();
    vi.advanceTimersByTime(60);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("clearMcpPending cancels timeout (reply wins race)", () => {
    const fn = vi.fn();
    registerMcpPendingTimeoutHandler(fn);
    (
      window as Window & { __studioQaPendingTimeoutMs?: number }
    ).__studioQaPendingTimeoutMs = 200;
    armMcpPendingTimeout();
    vi.advanceTimersByTime(50);
    clearMcpPending();
    vi.advanceTimersByTime(300);
    expect(fn).not.toHaveBeenCalled();
    expect(
      deriveMcpConnectionStatus({
        overlayActive: true,
        sessionKind: "agent",
        awaitingReply: false,
        now: Date.now(),
      }).phase
    ).toBe("control");
  });

  it("ERROR beats pending and clears on latch reset", () => {
    armMcpPendingTimeout();
    reportMcpConnectionError("latch fail");
    expect(
      deriveMcpConnectionStatus({
        overlayActive: true,
        sessionKind: "agent",
        awaitingReply: true,
        now: Date.now(),
      }).label
    ).toBe("AGENT — ERROR: latch fail");
    resetMcpStatusLatches();
    expect(
      deriveMcpConnectionStatus({
        overlayActive: true,
        sessionKind: "agent",
        awaitingReply: false,
        now: Date.now(),
      }).phase
    ).toBe("control");
  });

  it("pendingDeadlineAt from arm surfaces in derive", () => {
    (
      window as Window & { __studioQaPendingTimeoutMs?: number }
    ).__studioQaPendingTimeoutMs = 1000;
    armMcpPendingTimeout();
    const st = deriveMcpConnectionStatus({
      overlayActive: true,
      sessionKind: "agent",
      awaitingReply: true,
      now: Date.now(),
    });
    expect(st.phase).toBe("pending");
    expect(st.pendingDeadlineAt).toBeTypeOf("number");
    expect(st.pendingMsLeft).toBeGreaterThan(0);
  });
});
