import type { CjmOptionMetadata } from "@/app/recording/recordingMetadata";
import {
  cjmCompatibilityDiagnostic,
  type PlaybackDiagnosticError,
} from "@/app/shell/playbackDiagnostic";

export function refuseIncompatibleCjm(
  metadata: CjmOptionMetadata | undefined,
  report: (error: PlaybackDiagnosticError) => void
): boolean {
  if (!metadata || metadata.playable) return false;
  report(
    cjmCompatibilityDiagnostic({
      journeyId: metadata.journeyId,
      journeyLabel: metadata.label,
      issues: metadata.issues,
    })
  );
  return true;
}
