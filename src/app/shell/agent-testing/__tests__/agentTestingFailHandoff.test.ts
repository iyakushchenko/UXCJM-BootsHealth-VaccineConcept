/**
 * @vitest-environment happy-dom
 */
import { describe, expect, it, beforeEach } from "vitest";
import {
  beginFailHandoff,
  clearFailHandoff,
  confirmAgentFailTakeover,
  isFailHandoffPending,
  peekFailHandoff,
  resetFailHandoffForTests,
} from "@/app/shell/agent-testing/agentTestingFailHandoff";

describe("agentTestingFailHandoff", () => {
  beforeEach(() => {
    resetFailHandoffForTests();
  });

  it("pauses + logs handoff; confirm only after handshake", () => {
    const logs: string[] = [];
    const pauses: string[] = [];
    beginFailHandoff({
      reason: "scroll-anomaly",
      pause: (r) => pauses.push(r),
      log: (l) => logs.push(l),
    });
    expect(pauses).toEqual(["scroll-anomaly"]);
    expect(logs[0]).toBe("Caught error. Ask agent with the prompt: uxml control");
    expect(isFailHandoffPending()).toBe(true);
    expect(
      confirmAgentFailTakeover({
        source: "consume",
        log: (l) => logs.push(l),
      })
    ).toBe(true);
    expect(logs[1]).toMatch(/Agent take over confirmed/);
    expect(logs[2]).toMatch(/Please wait/);
    expect(peekFailHandoff().phase).toBe("waiting-resume");
    // Second confirm without new handoff = false
    expect(
      confirmAgentFailTakeover({
        source: "again",
        log: (l) => logs.push(l),
      })
    ).toBe(false);
    clearFailHandoff();
    expect(peekFailHandoff().phase).toBe("idle");
  });

  it("never confirms when idle", () => {
    expect(
      confirmAgentFailTakeover({
        source: "ghost",
        log: () => undefined,
      })
    ).toBe(false);
  });

  it("re-arms handoff after waiting-resume on new FAIL", () => {
    const logs: string[] = [];
    beginFailHandoff({
      reason: "first",
      pause: () => undefined,
      log: (l) => logs.push(l),
    });
    confirmAgentFailTakeover({
      source: "touch",
      log: (l) => logs.push(l),
    });
    expect(peekFailHandoff().phase).toBe("waiting-resume");
    beginFailHandoff({
      reason: "second-alarm",
      pause: () => undefined,
      log: (l) => logs.push(l),
    });
    expect(isFailHandoffPending()).toBe(true);
    expect(peekFailHandoff().reason).toBe("second-alarm");
    expect(logs.filter((l) => l.startsWith("Caught error")).length).toBe(2);
  });
});
