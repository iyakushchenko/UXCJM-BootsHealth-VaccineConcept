import type { CjmOptionMetadata } from "@/app/recording/recordingMetadata";
import { getStudioRelease } from "@/app/shell/studioRelease";

export type CjmCompatibilitySummary = {
  affected: CjmOptionMetadata[];
  affectedCjmCount: number;
  issueCount: number;
  blockingIssueCount: number;
};

export function buildCjmCompatibilitySummary(
  metadataById: Readonly<Record<string, CjmOptionMetadata>>,
): CjmCompatibilitySummary {
  const affected = Object.values(metadataById).filter((item) => item.issues.length > 0);
  return {
    affected,
    affectedCjmCount: affected.length,
    issueCount: affected.reduce((total, item) => total + item.issues.length, 0),
    blockingIssueCount: affected.reduce(
      (total, item) => total + item.issues.filter((issue) => issue.severity === "blocking").length,
      0,
    ),
  };
}

export function buildGlobalCjmDiagnostic(options: {
  projectId: string;
  projectLabel: string;
  summary: CjmCompatibilitySummary;
}) {
  const release = getStudioRelease();
  return {
    kind: "studio-global-cjm-diagnostic",
    generatedAt: new Date().toISOString(),
    project: { id: options.projectId, label: options.projectLabel },
    studio: { version: release.version, channel: release.channel },
    affectedCjmCount: options.summary.affectedCjmCount,
    issueCount: options.summary.issueCount,
    blockingIssueCount: options.summary.blockingIssueCount,
    recommendedTestSuiteId: "all-cjms",
    journeys: options.summary.affected.map((item) => item.diagnostic),
  };
}
