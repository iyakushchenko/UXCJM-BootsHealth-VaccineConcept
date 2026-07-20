/**
 * PO interrupt A–E: freeze, RTT floor, presence.
 * @vitest-environment happy-dom
 */
import { describe, expect, it, beforeEach } from "vitest";
import {
  beginFailHandoff,
  clearFailHandoff,
  confirmAgentFailTakeover,
  resetFailHandoffForTests,
} from "@/app/shell/agent-testing/agentTestingFailHandoff";
import {
  clearQaProgressFreeze,
  isQaProgressFrozen,
  setQaProgressFreeze,
} from "@/app/shell/agent-testing/agentTestingProgressFreeze";
import {
  getQaMessageRttStats,
  messageAwarePendingFloorMs,
  noteQaMessageConsumed,
  noteQaMessageSent,
  resetQaMessageRttForTests,
} from "@/app/shell/agent-testing/agentTestingMessageRtt";
import {
  clearQaAgentPresence,
  formatPresenceSuffix,
  isQaAgentPresenceStaleForAutoPause,
  peekQaAgentPresence,
  QA_AGENT_AUTO_PAUSE_MS,
  QA_AGENT_PRESENT_MS,
  touchQaAgentPresence,
} from "@/app/shell/agent-testing/agentTestingPresence";

describe("A–E interrupt primitives", () => {
  beforeEach(() => {
    resetFailHandoffForTests();
    clearQaProgressFreeze();
    resetQaMessageRttForTests();
    clearQaAgentPresence();
  });

  it("E: freezes during Handing off; lifts after confirm", () => {
    beginFailHandoff({
      reason: "po-alarm",
      pause: () => undefined,
      log: () => undefined,
    });
    setQaProgressFreeze("fail-handoff:po-alarm");
    expect(isQaProgressFrozen()).toBe(true);

    confirmAgentFailTakeover({
      source: "test",
      log: () => undefined,
    });
    clearQaProgressFreeze();
    expect(isQaProgressFrozen()).toBe(false);

    clearFailHandoff();
  });

  it("C: measures Message RTT and raises PENDING floor", () => {
    noteQaMessageSent(1_000);
    const rtt = noteQaMessageConsumed(1_450);
    expect(rtt).toBe(450);
    expect(getQaMessageRttStats().lastRttMs).toBe(450);
    // 3×450 + 8000 = 9350 > base 1000
    expect(messageAwarePendingFloorMs(1_000)).toBe(9_350);
  });

  it("D: ONLINE presence label + suffix", () => {
    expect(peekQaAgentPresence().online).toBe(false);
    touchQaAgentPresence("test");
    const p = peekQaAgentPresence();
    expect(p.online).toBe(true);
    expect(p.label).toBe("ONLINE");
    expect(formatPresenceSuffix(p.label)).toBe(" · ONLINE");
  });

  it("D: stale presence is Last seen only — never ONLINE + seen", () => {
    touchQaAgentPresence("test");
    const mem = (
      window as Window & {
        __studioQaPresenceMemory?: {
          online: boolean;
          lastSeenAt: number;
          linkedAt: number;
        };
      }
    ).__studioQaPresenceMemory;
    expect(mem).toBeTruthy();
    if (mem) mem.lastSeenAt = Date.now() - 68_000;
    const p = peekQaAgentPresence();
    expect(p.online).toBe(false);
    expect(p.label).toMatch(/^Last seen \d+s ago$/);
    expect(p.label).not.toMatch(/ONLINE/i);
  });

  it("D: auto-pause TTL aligns with present window (8s)", () => {
    expect(QA_AGENT_AUTO_PAUSE_MS).toBe(QA_AGENT_PRESENT_MS);
    expect(QA_AGENT_AUTO_PAUSE_MS).toBe(8_000);
    touchQaAgentPresence("test");
    expect(isQaAgentPresenceStaleForAutoPause(7_999)).toBe(false);
    expect(isQaAgentPresenceStaleForAutoPause(8_001)).toBe(true);
  });
});
