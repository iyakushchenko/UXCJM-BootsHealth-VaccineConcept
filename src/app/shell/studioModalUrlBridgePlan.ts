/**
 * Pure planner for URL → live modal apply (deep-link catch-up).
 * Suppresses re-open while an intentional close is waiting for URL sync
 * (wire clears live before `&modal=` is stripped — Quinn QV close race).
 */

export type StudioModalUrlBridgePlanInput = {
  urlModalId: string | undefined;
  liveModalId: string | undefined;
  prevLiveModalId: string | undefined;
  /** Modal id we are suppressing URL→open for (intentional close in flight). */
  closingModalId: string | undefined;
};

export type StudioModalUrlBridgePlan = {
  nextPrevLiveModalId: string | undefined;
  nextClosingModalId: string | undefined;
  /** When set, call applyModalFromUrl with this id. */
  applyModalId: string | undefined;
};

/**
 * Decide whether stale `&modal=` should open the dialog after a wireTick.
 * Never closes from URL here (open→URL write race); only open / suppress.
 */
export function planStudioModalUrlBridgeApply(
  input: StudioModalUrlBridgePlanInput
): StudioModalUrlBridgePlan {
  const { urlModalId, liveModalId, prevLiveModalId } = input;
  let closingModalId = input.closingModalId;

  // URL caught up — drop suppress for the closed id.
  if (closingModalId && urlModalId !== closingModalId) {
    closingModalId = undefined;
  }

  // Live dropped (or left) a modal while URL may still show it → intentional close.
  if (prevLiveModalId && prevLiveModalId !== liveModalId) {
    if (!liveModalId || urlModalId === prevLiveModalId) {
      closingModalId = prevLiveModalId;
    }
  }

  let applyModalId: string | undefined;
  if (
    urlModalId &&
    urlModalId !== liveModalId &&
    !(closingModalId && urlModalId === closingModalId)
  ) {
    applyModalId = urlModalId;
  }

  return {
    nextPrevLiveModalId: liveModalId,
    nextClosingModalId: closingModalId,
    applyModalId,
  };
}
