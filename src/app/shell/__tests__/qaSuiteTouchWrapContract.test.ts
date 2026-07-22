import { describe, expect, it } from "vitest";
import {
  auditQuietHelpersNotTouchWrapped,
  isQuietHelperSuffix,
  MUST_STAY_QUIET_SUITE_HELPER_SUFFIXES,
  QA_SUITE_NO_TOUCH_WRAP_RULE_ID,
  QA_SUITE_TOUCH_WRAP_DIG,
  STUDIO_OVERLAY_ARMED_FLAG,
} from "@/app/shell/qaSuiteTouchWrapContract";

describe("qaSuiteTouchWrapContract (R16)", () => {
  it("exports a dig card agents can follow", () => {
    expect(QA_SUITE_NO_TOUCH_WRAP_RULE_ID).toBe("qa-suite-no-touch-wrap");
    expect(QA_SUITE_TOUCH_WRAP_DIG).toContain("DIG · qa-suite-no-touch-wrap");
    expect(QA_SUITE_TOUCH_WRAP_DIG).toContain("helperOverlayArm.ts");
    expect(QA_SUITE_TOUCH_WRAP_DIG).toContain("GetQaSuiteStatus");
  });

  it("lists GetQaSuiteStatus and suite runners as must-stay-quiet", () => {
    expect(MUST_STAY_QUIET_SUITE_HELPER_SUFFIXES).toContain("GetQaSuiteStatus");
    expect(MUST_STAY_QUIET_SUITE_HELPER_SUFFIXES).toContain("StartQaSuite");
    expect(MUST_STAY_QUIET_SUITE_HELPER_SUFFIXES).toContain("RunQaSelfTestSmoke");
  });

  it("pattern-matches future *QaSuite* / status poll suffixes", () => {
    expect(isQuietHelperSuffix("GetQaSuiteStatus")).toBe(true);
    expect(isQuietHelperSuffix("GetFutureQaSuiteStatus")).toBe(true);
    expect(isQuietHelperSuffix("CancelExperimentalQaSuite")).toBe(true);
    expect(isQuietHelperSuffix("GetMcpConnectionStatus")).toBe(true);
    expect(isQuietHelperSuffix("PeekPoSignal")).toBe(true);
    // Mutating prove runners that are NOT suite/status — pattern must not over-match
    // plain product helpers without Status/Suite markers.
    expect(isQuietHelperSuffix("StartRecording")).toBe(false);
    expect(isQuietHelperSuffix("SetOrchestraMode")).toBe(false);
  });

  it("audit fails with dig when a quiet helper is touch-wrapped", () => {
    const armed = Object.assign(() => ({ phase: "idle" }), {
      [STUDIO_OVERLAY_ARMED_FLAG]: true,
    });
    const win = {
      __studioGetQaSuiteStatus: armed,
    } as unknown as Window & Record<string, unknown>;
    const audit = auditQuietHelpersNotTouchWrapped(win);
    expect(audit.ok).toBe(false);
    expect(audit.armed).toContain("__studioGetQaSuiteStatus");
    expect(audit.dig).toContain("DIG · qa-suite-no-touch-wrap");
  });

  it("audit passes when quiet helpers are plain functions", () => {
    const win = {
      __studioGetQaSuiteStatus: () => ({ phase: "idle" }),
      __protoGetQaSuiteStatus: () => ({ phase: "idle" }),
    } as unknown as Window & Record<string, unknown>;
    expect(auditQuietHelpersNotTouchWrapped(win).ok).toBe(true);
  });
});
