import { describe, expect, it, beforeEach } from "vitest";
import {
  QA_SELF_TEST_SCENARIOS,
  listQaSelfTestTrustScenarios,
} from "@/app/shell/agent-testing/agentTestingSelfTest.scenarios";
import { runQaSelfTestPureChecks } from "@/app/shell/agent-testing/agentTestingSelfTest";
import { resetQaSessionForTests } from "@/app/shell/agent-testing/agentTestingSession";

describe("agentTestingSelfTest", () => {
  beforeEach(() => {
    resetQaSessionForTests();
  });

  it("catalog has trust scenarios for dual-role marathon", () => {
    expect(QA_SELF_TEST_SCENARIOS.length).toBeGreaterThanOrEqual(10);
    const trust = listQaSelfTestTrustScenarios();
    expect(trust.some((s) => s.id === "observe-alarm-escalate")).toBe(true);
    expect(trust.some((s) => s.id === "refresh-mid-control")).toBe(true);
    expect(trust.every((s) => s.helpers.length > 0)).toBe(true);
  });

  it("pure checks pass (observe escalate/unlock + handoff)", () => {
    const checks = runQaSelfTestPureChecks();
    expect(checks.every((c) => c.ok)).toBe(true);
  });

  it("exports near-real-life pace constants", async () => {
    const {
      QA_SELF_TEST_STEP_MS,
      QA_SELF_TEST_SETTLE_MS,
      QA_SELF_TEST_CLEAR_MS,
    } = await import("@/app/shell/agent-testing/agentTestingSelfTest");
    expect(QA_SELF_TEST_STEP_MS).toBeGreaterThanOrEqual(200);
    expect(QA_SELF_TEST_STEP_MS).toBeLessThanOrEqual(500);
    expect(QA_SELF_TEST_SETTLE_MS).toBeGreaterThanOrEqual(800);
    expect(QA_SELF_TEST_CLEAR_MS).toBeGreaterThanOrEqual(100);
  });
});
