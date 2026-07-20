/**
 * Lean QA overlay self-test smoke for MCP / agents.
 * Full dual-role checklist: SELF_TEST.md — this runner covers fast trust checks only.
 */

import { QA_SELF_TEST_SCENARIOS } from "@/app/shell/agent-testing/agentTestingSelfTest.scenarios";
import {
  escalateObserveToAgent,
  getSessionKind,
  resetQaSessionForTests,
  resolveHandoffKind,
  setSessionKind,
  shouldWipeOnHandoff,
  unlockAgentToObserve,
} from "@/app/shell/agent-testing/agentTestingSession";

export type QaSelfTestSmokeResult = {
  ok: boolean;
  atIso: string;
  scenarioCount: number;
  checks: Array<{ id: string; ok: boolean; detail?: string }>;
};

function check(id: string, ok: boolean, detail?: string) {
  return { id, ok, detail };
}

/** Pure/session checks — always safe in Vitest + browser. */
export function runQaSelfTestPureChecks(): QaSelfTestSmokeResult["checks"] {
  resetQaSessionForTests();
  const out: QaSelfTestSmokeResult["checks"] = [];

  setSessionKind("observe");
  out.push(
    check(
      "observe-open-capture",
      getSessionKind() === "observe",
      "sessionKind observe"
    )
  );

  const escalated = escalateObserveToAgent();
  out.push(
    check(
      "observe-alarm-escalate",
      escalated && getSessionKind() === "agent",
      "escalateObserveToAgent"
    )
  );

  const unlocked = unlockAgentToObserve();
  out.push(
    check(
      "observe-unlock",
      unlocked && getSessionKind() === "observe",
      "unlockAgentToObserve"
    )
  );

  out.push(
    check(
      "handoff-wipe-clears-note",
      shouldWipeOnHandoff({}) === true &&
        shouldWipeOnHandoff({ oversee: false }) === true,
      "shouldWipeOnHandoff"
    )
  );
  out.push(
    check(
      "handoff-oversee-keeps-note",
      shouldWipeOnHandoff({ oversee: true }) === false &&
        resolveHandoffKind({ oversee: true, kind: "observe" }) === "observe",
      "oversee keep + kind"
    )
  );

  out.push(
    check(
      "catalog",
      QA_SELF_TEST_SCENARIOS.length >= 10,
      `${QA_SELF_TEST_SCENARIOS.length} scenarios`
    )
  );

  resetQaSessionForTests();
  return out;
}

/**
 * Browser smoke: pure checks + optional DOM probe when overlay APIs exist.
 * Does not replace full SELF_TEST.md marathon — gates trust-breakers only.
 */
export async function runQaSelfTestSmoke(): Promise<QaSelfTestSmokeResult> {
  const checks = runQaSelfTestPureChecks();

  if (typeof window !== "undefined") {
    const w = window as Window & {
      __studioForceClearAgentTestingOverlay?: () => void;
      __studioOpenQaLogger?: (opts?: { kind?: string }) => void;
      __studioQaSessionKind?: () => string;
      __studioMcpConnectionStatus?: () => { phase?: string };
      __studioAgentTestingOverlay?: {
        ringAlarm?: (n?: string) => void;
        unlockObserve?: () => boolean;
      };
      __studioPeekPoSignal?: () => { code?: string } | null;
      __studioConsumePoSignal?: () => { code?: string } | null;
      __studioAppendPoNote?: (t: string) => boolean;
      __studioToggleQaLogger?: () => void;
    };

    const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
    try {
      w.__studioForceClearAgentTestingOverlay?.();
      await sleep(80);
      w.__studioOpenQaLogger?.({ kind: "observe" });
      await sleep(850);
      const kind = w.__studioQaSessionKind?.();
      const phase = w.__studioMcpConnectionStatus?.()?.phase;
      checks.push(
        check(
          "dom-observe-open",
          kind === "observe" && (phase === "observe" || phase === "connected"),
          `kind=${kind} phase=${phase}`
        )
      );

      w.__studioAgentTestingOverlay?.ringAlarm?.("self-test");
      await sleep(200);
      const latch =
        w.__studioPeekPoSignal?.() ??
        (window as Window & { __studioAgentTestingTakeover?: { code?: string } })
          .__studioAgentTestingTakeover;
      checks.push(
        check(
          "dom-observe-alarm",
          w.__studioQaSessionKind?.() === "agent" &&
            latch?.code === "ALARM_SEQUENCE_MISMATCH",
          latch?.code
        )
      );
      w.__studioConsumePoSignal?.();

      const unlocked = w.__studioAgentTestingOverlay?.unlockObserve?.();
      checks.push(
        check(
          "dom-unlock",
          unlocked === true && w.__studioQaSessionKind?.() === "observe",
          `unlocked=${unlocked}`
        )
      );

      const empty = w.__studioAppendPoNote?.("   ");
      checks.push(check("empty-message-noop", empty === false, String(empty)));

      w.__studioToggleQaLogger?.();
      await sleep(80);
      checks.push(
        check(
          "bug-toggle-observe-noop",
          w.__studioQaSessionKind?.() === "observe" &&
            document.getElementById("agent-testing-overlay")?.dataset
              ?.active === "true",
          "bug toggle must not close observe"
        )
      );
    } catch (err) {
      checks.push(
        check("dom-smoke", false, err instanceof Error ? err.message : "error")
      );
    } finally {
      try {
        w.__studioForceClearAgentTestingOverlay?.();
      } catch {
        /* hang-safe */
      }
    }
  }

  return {
    ok: checks.every((c) => c.ok),
    atIso: new Date().toISOString(),
    scenarioCount: QA_SELF_TEST_SCENARIOS.length,
    checks,
  };
}
