/**
 * @vitest-environment happy-dom
 *
 * Regression coverage for the "title vs chrome" state-machine desync class
 * (LESSONS_LEARNED 2026-07-23): the panel title must always reflect the
 * live `getSessionKind()` — never a stale value painted once at an earlier
 * transition — and agent-presence chrome (Take control link, "Agent
 * stale"/"disconnected" log lines, auto-pause) must never leak into a
 * session whose live kind is "manual".
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/app/scenario/demoCursor", () => ({
  removeDemoCursor: vi.fn(),
  cancelDemoCursorTravel: vi.fn(),
  setDemoCursorJourneyMode: vi.fn(),
}));

vi.mock("@/app/scenario/playbackScroll", () => ({
  cancelPlaybackScroll: vi.fn(),
}));

import {
  forceClearAgentTestingOverlay,
  getSessionKind,
  handoffQaSession,
  installAgentTestingOverlayApi,
  openAgentTestingLogger,
  takeControlSession,
  touchAgentTestingOverlay,
  uninstallAgentTestingOverlayApi,
} from "@/app/shell/agent-testing";
import {
  resetQaSessionForTests,
  setSessionKind,
  titleForSessionKind,
  type AgentTestingSessionKind,
} from "@/app/shell/agent-testing/agentTestingSession";

function titleText(): string {
  return (
    document.querySelector<HTMLElement>(".studio-agent-testing-overlay__title")
      ?.textContent ?? ""
  );
}

function takeControlBtn(): HTMLButtonElement | null {
  return document.querySelector<HTMLButtonElement>(
    ".studio-agent-testing-overlay__take-control"
  );
}

function logText(): string {
  return (
    document.querySelector<HTMLElement>(".studio-agent-testing-overlay__log")
      ?.textContent ?? ""
  );
}

/** Title + Take control must never contradict each other for any kind. */
function assertConsistentChrome(kind: AgentTestingSessionKind): void {
  expect(getSessionKind()).toBe(kind);
  expect(titleText()).toBe(titleForSessionKind(kind));
  const btn = takeControlBtn();
  expect(btn?.hidden).toBe(kind === "manual");
}

describe("agentTesting title/chrome consistency", () => {
  beforeEach(() => {
    resetQaSessionForTests();
    installAgentTestingOverlayApi();
    window.history.replaceState(
      null,
      "",
      "/?project=boots-pharmacy&screen=book-step-1"
    );
  });

  afterEach(() => {
    forceClearAgentTestingOverlay();
    uninstallAgentTestingOverlayApi();
    vi.useRealTimers();
  });

  it("title always matches getSessionKind() — property check across manual/agent/observe", () => {
    openAgentTestingLogger();
    assertConsistentChrome("manual");

    handoffQaSession({ oversee: true, kind: "agent" });
    assertConsistentChrome("agent");

    handoffQaSession({ oversee: true, kind: "observe" });
    assertConsistentChrome("observe");

    takeControlSession("back-to-manual");
    assertConsistentChrome("manual");
  });

  it("REGRESSION: fail-handoff → agent takeover confirm repaints title (was stuck on stale Manual QA)", () => {
    // Reproduces the exact reported bug path: a manual session hits a FAIL,
    // hands off to an agent via the real confirm-handshake API (not a
    // synthetic setSessionKind) — this used to flip sessionKind to "agent"
    // without ever repainting the title.
    openAgentTestingLogger();
    assertConsistentChrome("manual");

    const w = window as Window & {
      __studioBeginQaFailHandoff?: (reason: string) => void;
      __studioConfirmFailTakeover?: () => boolean;
    };
    w.__studioBeginQaFailHandoff?.("unit-fail");
    const confirmed = w.__studioConfirmFailTakeover?.();

    expect(confirmed).toBe(true);
    // Before the fix: getSessionKind() === "agent" but titleText() stayed
    // "Manual QA" and Take control was visible — a title/chrome contradiction.
    assertConsistentChrome("agent");
  });

  it("self-heals a kind change that forgot to repaint the title, on the next chrome sync", () => {
    openAgentTestingLogger();
    assertConsistentChrome("manual");

    // Simulate a future call site that flips kind directly (bypassing the
    // paintSessionKindTitle wrapper, exactly what the real bug's
    // confirmAgentHandshake → startFreshAgentInterventionSession path did).
    setSessionKind("agent");
    // touchAgentTestingOverlay() with no args, while already agent-kind,
    // takes the neutral fall-through branch that only calls
    // syncSessionChrome() — it does not itself repaint the title.
    touchAgentTestingOverlay();

    // syncSessionChrome's drift check must have caught + corrected the title
    // (and every other kind-driven chrome stays consistent with it).
    assertConsistentChrome("agent");
  });

  it("a genuinely manual session (never touched by an agent) never shows agent-presence chatter", () => {
    vi.useFakeTimers();
    openAgentTestingLogger();
    assertConsistentChrome("manual");

    vi.advanceTimersByTime(20_000);

    expect(logText()).not.toMatch(/Agent stale/i);
    expect(logText()).not.toMatch(/Agent disconnected/i);
    const mcpRow = document.querySelector<HTMLElement>(
      ".studio-agent-testing-overlay__mcp-status"
    );
    expect(mcpRow?.hidden).toBe(true);
  });

  it("stale agent heartbeat does not leak 'Agent stale' chrome once sessionKind flips to manual, even if presence isn't explicitly cleared", () => {
    vi.useFakeTimers();
    handoffQaSession({ oversee: true, kind: "agent" });
    assertConsistentChrome("agent");

    // Flip kind directly to manual (bypassing takeControlSession's explicit
    // clearQaAgentPresence()) to prove the auto-pause guard itself is scoped
    // to agent/observe, not just cleaned up incidentally at one call site.
    setSessionKind("manual");

    const mem = (
      window as Window & {
        __studioQaPresenceMemory?: { lastSeenAt: number; online: boolean };
      }
    ).__studioQaPresenceMemory;
    if (mem) mem.lastSeenAt = Date.now() - 12_000;

    vi.advanceTimersByTime(2_500);

    expect(logText()).not.toMatch(/Agent stale/i);
    expect(window.__studioAgentTestingOverlay?.isCapturePaused()).toBe(false);
  });

  it("Take control (agent → manual) clears agent presence so no stale/disconnected chrome lingers", () => {
    vi.useFakeTimers();
    handoffQaSession({ oversee: true, kind: "agent" });
    assertConsistentChrome("agent");

    const mem = (
      window as Window & {
        __studioQaPresenceMemory?: { lastSeenAt: number; online: boolean };
      }
    ).__studioQaPresenceMemory;
    if (mem) mem.lastSeenAt = Date.now() - 12_000;

    takeControlSession("po-take-control");
    assertConsistentChrome("manual");

    vi.advanceTimersByTime(20_000);

    expect(logText()).not.toMatch(/Agent stale/i);
    expect(window.__studioAgentTestingOverlay?.isCapturePaused()).toBe(false);
  });
});
