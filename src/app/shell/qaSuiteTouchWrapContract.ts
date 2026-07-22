/**
 * Auto-Rule **qa-suite-no-touch-wrap** (R16) — SSoT dig card + quiet-suffix contract.
 *
 * Failure class (LESSONS 2026-07-22): suite/UI polls `__studioGetQaSuiteStatus` while
 * `qa-self-test` forceClears + opens Observe. If that helper is touch-wrapped, CONTROL
 * re-arms in ~50ms → `OpenQaLogger({ kind:'observe' })` no-ops →
 * `dom-observe-open kind=agent phase=control`.
 *
 * Agents: when you see that symptom, dig HERE first — not in the page under test.
 */

export const QA_SUITE_NO_TOUCH_WRAP_RULE_ID = "qa-suite-no-touch-wrap" as const;

export const QA_SUITE_NO_TOUCH_WRAP_TITLE =
  "QA suite / status helpers must never helper-touch-wrap (polls must not re-arm CONTROL)";

/**
 * Copy-paste dig card — surface in self-test FAIL detail + LESSONS + TEAM_KNOWLEDGE.
 */
export const QA_SUITE_TOUCH_WRAP_DIG = [
  "DIG · qa-suite-no-touch-wrap (R16)",
  "Symptom: suite mcp-sanity PASS → qa-self-test FAIL dom-observe-open kind=agent phase=control (direct sanity→smoke PASS).",
  "Probable cause: a polled/status window helper is touch-wrapped (`fn.__studioOverlayArmed === true`). Live GetQaSuiteStatus polls re-arm CONTROL after forceClear; Observe open no-ops on agent lock.",
  "Where: src/app/shell/helperOverlayArm.ts · src/app/shell/qaSuiteTouchWrapContract.ts · src/app/shell/qaAutonomousSuite.ts",
  "Fix: add/keep the suffix in quiet contract (`isQuietHelperSuffix` / MUST_STAY_QUIET) so armOverlayOnStudioHelpers unwraps it; hard-reload :5173 (stale armed closures survive HMR until re-arm).",
  "Prove: forceClear → poll __studioGetQaSuiteStatus ×20 → kind stays manual + no overlay; then suite [mcp-sanity, qa-self-test] PASS. Assert !window.__studioGetQaSuiteStatus.__studioOverlayArmed.",
].join("\n");

/**
 * Explicit suite / QA-runner suffixes that MUST stay quiet (never touch-wrap).
 * Pattern match in `isQuietHelperSuffix` catches future `*QaSuite*` names too.
 */
export const MUST_STAY_QUIET_SUITE_HELPER_SUFFIXES = [
  "GetQaSuiteStatus",
  "StartQaSuite",
  "RunQaSuiteById",
  "ProceedQaSuite",
  "CancelQaSuite",
  "RunGlobalCompatibilityTests",
  "RunQaSelfTestSmoke",
  "RunMcpSanityCheck",
  "RunMcpPageProbe",
] as const;

/** Overlay arm flag set by helperOverlayArm wrapHelper. */
export const STUDIO_OVERLAY_ARMED_FLAG = "__studioOverlayArmed" as const;

/**
 * True when this window-API suffix must never touch-wrap.
 * Patterns catch future suite/status poll helpers so agents cannot “forget the list”.
 */
export function isQuietHelperSuffix(suffix: string): boolean {
  if (MUST_STAY_QUIET_SUITE_HELPER_SUFFIXES.includes(
    suffix as (typeof MUST_STAY_QUIET_SUITE_HELPER_SUFFIXES)[number]
  )) {
    return true;
  }
  // Any *QaSuite* / CompatibilityTests runner — polls + start/cancel own their overlay.
  if (/QaSuite|CompatibilityTests/i.test(suffix)) return true;
  // Status / peek getters that agents and suite chrome poll in tight loops.
  if (
    /^(Get|Peek|Is|Has)/.test(suffix) &&
    /(Status|Suite|Diag|Hud|State|Recording|LoggedIn|PoSignal|Takeover|Frozen)$/.test(
      suffix
    )
  ) {
    return true;
  }
  return false;
}

export type QuietHelperArmAudit = {
  ok: boolean;
  armed: string[];
  dig: string;
};

/**
 * Runtime / Vitest audit — any quiet helper still touch-wrapped = FAIL + dig card.
 */
export function auditQuietHelpersNotTouchWrapped(
  win: Window & Record<string, unknown> = window as Window & Record<string, unknown>
): QuietHelperArmAudit {
  const armed: string[] = [];
  for (const suffix of MUST_STAY_QUIET_SUITE_HELPER_SUFFIXES) {
    for (const prefix of ["__studio", "__proto"] as const) {
      const key = `${prefix}${suffix}`;
      const fn = win[key];
      if (typeof fn === "function" && (fn as { [STUDIO_OVERLAY_ARMED_FLAG]?: boolean })[STUDIO_OVERLAY_ARMED_FLAG]) {
        armed.push(key);
      }
    }
  }
  return {
    ok: armed.length === 0,
    armed,
    dig: QA_SUITE_TOUCH_WRAP_DIG,
  };
}
