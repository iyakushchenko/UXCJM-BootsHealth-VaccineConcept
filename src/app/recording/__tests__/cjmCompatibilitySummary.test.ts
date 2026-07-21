import { describe, expect, it } from "vitest";
import {
  buildCjmCompatibilitySummary,
  buildGlobalCjmDiagnostic,
} from "@/app/recording/cjmCompatibilitySummary";
import type { CjmOptionMetadata } from "@/app/recording/recordingMetadata";

function metadata(id: string, issues: CjmOptionMetadata["issues"]): CjmOptionMetadata {
  return {
    journeyId: id,
    label: `Journey ${id}`,
    stepCount: 3,
    authLabel: "User",
    recordedAt: null,
    recordedAtLabel: "Built-in",
    authorLabel: "Studio",
    builtIn: false,
    issues,
    playable: issues.length === 0,
    summary: "3 steps · User",
    diagnostic: { kind: "studio-cjm-diagnostic", journey: { id }, issues },
  };
}

describe("CJM compatibility summary", () => {
  it("counts affected CJMs separately from exact issues and builds an agent payload", () => {
    const summary = buildCjmCompatibilitySummary({
      a: metadata("a", [{ code: "legacy", detail: "Legacy contract" }]),
      b: metadata("b", [
        { code: "empty", detail: "No steps", severity: "blocking" },
        { code: "target", detail: "Target missing", severity: "blocking" },
      ]),
      healthy: metadata("healthy", []),
    });
    expect(summary).toMatchObject({ affectedCjmCount: 2, issueCount: 3, blockingIssueCount: 2, retestIssueCount: 1 });
    const report = buildGlobalCjmDiagnostic({ projectId: "demo", projectLabel: "Demo", summary });
    expect(report).toMatchObject({ kind: "studio-global-cjm-diagnostic", affectedCjmCount: 2, issueCount: 3, recommendedTestSuiteId: "all-cjms" });
    expect(report.journeys).toHaveLength(2);
  });
});
