import type { RetreatSelectionGoal } from "@/projects/types";
import { beatHasRetreatableState } from "@/app/orchestra/journeyRetreatSync";
import type { JourneyBeat } from "@/app/orchestra/types";
import type { PlaybackInteractionRecord } from "@/app/shell/playbackInteractionContext";

export type RetreatAnomalyKind =
  | "retreat-selection-mismatch"
  | "retreat-sync-no-op";

export type RetreatAnomaly = {
  kind: RetreatAnomalyKind;
  message: string;
  detail?: string;
  expected?: string;
  actual?: string;
};

export type RetreatSelectionCheckContext = {
  transportAction?: string;
  beatId?: string;
  beatLabel?: string;
  screenFramesBeat: boolean;
  isScripting: boolean;
  isPausingBeforeReveal: boolean;
  selectionGoal?: RetreatSelectionGoal | null;
  lastRetreatSync?: PlaybackInteractionRecord | null;
  retreatSyncGraceMs?: number;
};

function formatRetreatSelectionDetail(ctx: RetreatSelectionCheckContext): string {
  const goal = ctx.selectionGoal;
  return [
    ctx.beatId ? `beat=${ctx.beatId}` : "",
    goal?.expected ? `expected=${goal.expected}` : "",
    goal?.actual ? `actual=${goal.actual}` : "",
    ctx.lastRetreatSync?.scriptId
      ? `lastSync=${ctx.lastRetreatSync.scriptId}`
      : "",
    ctx.lastRetreatSync?.atMs != null
      ? `syncAgeMs=${Math.round(performance.now() - ctx.lastRetreatSync.atMs)}`
      : "",
  ]
    .filter(Boolean)
    .join(" ");
}

/** Step back restored the beat but date/time/overlay selection did not match baseline. */
export function detectRetreatSelectionMismatch(
  ctx: RetreatSelectionCheckContext
): RetreatAnomaly | null {
  if (ctx.transportAction !== "step-back") return null;
  if (ctx.screenFramesBeat) return null;
  if (ctx.isScripting || ctx.isPausingBeforeReveal) return null;
  if (!ctx.beatId || !ctx.selectionGoal?.expectsSelection) return null;
  if (ctx.selectionGoal.domGoalMet !== false) return null;

  const label = ctx.beatLabel ?? ctx.beatId;
  return {
    kind: "retreat-selection-mismatch",
    message: `Step back to "${label}" but UI selection did not restore expected baseline`,
    detail: formatRetreatSelectionDetail(ctx),
    expected: ctx.selectionGoal.expected,
    actual: ctx.selectionGoal.actual,
  };
}

/** Beat expects retreat sync but no sync ran within the grace window after step-back. */
export function detectRetreatSyncNoOp(
  ctx: RetreatSelectionCheckContext,
  beat: JourneyBeat | undefined
): RetreatAnomaly | null {
  if (ctx.transportAction !== "step-back") return null;
  if (ctx.screenFramesBeat) return null;
  if (ctx.isScripting || ctx.isPausingBeforeReveal) return null;
  if (!ctx.beatId || !beat || !beatHasRetreatableState(beat)) return null;
  if (!ctx.selectionGoal?.expectsSelection) return null;

  const graceMs = ctx.retreatSyncGraceMs ?? 800;
  const sync = ctx.lastRetreatSync;
  const syncRecent =
    sync?.kind === "retreat-sync" &&
    sync.beatId === ctx.beatId &&
    performance.now() - sync.atMs <= graceMs;

  if (syncRecent) return null;

  const label = ctx.beatLabel ?? ctx.beatId;
  return {
    kind: "retreat-sync-no-op",
    message: `Step back to "${label}" but retreat sync did not run`,
    detail: formatRetreatSelectionDetail(ctx),
    expected: "syncBeatRetreatState completes for this beat",
    actual: sync
      ? sync.kind === "retreat-sync"
        ? `stale sync for ${sync.beatId ?? "unknown beat"}`
        : `last interaction was ${sync.kind}`
      : "no retreat-sync recorded",
  };
}

export function evaluateRetreatSelectionAnomalies(
  ctx: RetreatSelectionCheckContext,
  beat: JourneyBeat | undefined
): RetreatAnomaly | null {
  return (
    detectRetreatSyncNoOp(ctx, beat) ??
    detectRetreatSelectionMismatch(ctx)
  );
}
