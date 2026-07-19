/**
 * CJM type-in cursor guard — keep robo-cursor visible; latch if hidden.
 *
 * Split from playbackDiag to avoid import cycles with agentTestingPoSignal.
 */

import {
  nudgeDemoCursorForTypeIn,
  parkDemoCursorForTypeIn,
  readDemoCursorDomState,
} from "@/app/scenario/demoCursor";
import { latchPoSignal } from "@/app/shell/agent-testing/agentTestingPoSignal";
import { playbackDiagCursor } from "@/app/shell/playbackDiag";

let hiddenLatchedForActiveTypeIn = false;

export function resetTypeInCursorGuard(): void {
  hiddenLatchedForActiveTypeIn = false;
}

/** Park near field at type-in start; log visibility. */
export function beginTypeInCursorGuard(target: HTMLElement): void {
  resetTypeInCursorGuard();
  parkDemoCursorForTypeIn(target);
  reportTypeInCursorVisibility("start", target);
}

/** Keep park near caret; re-park + latch if DOM missing/opacity0. */
export function tickTypeInCursorGuard(target: HTMLElement, chars: number): void {
  nudgeDemoCursorForTypeIn(target, chars);
  if (chars === 0 || chars % 16 === 0) {
    reportTypeInCursorVisibility("progress", target, chars);
  }
}

export function reportTypeInCursorVisibility(
  phase: string,
  _target?: HTMLElement,
  chars?: number
): boolean {
  const dom = readDemoCursorDomState();
  const detail = dom.visible
    ? `type-in ${phase} cursor visible`
    : `type-in ${phase} cursor HIDDEN (missing=${dom.missing} opacity=${dom.opacity ?? "n/a"} display=${dom.display ?? "n/a"})`;
  playbackDiagCursor({
    action: dom.visible ? "park" : "dwell-no-cursor",
    detail,
    parked: dom.parked,
    parkReason: dom.parked ? "type-in-park" : null,
  });
  if (!dom.visible && !hiddenLatchedForActiveTypeIn) {
    hiddenLatchedForActiveTypeIn = true;
    try {
      latchPoSignal({
        type: "cursor",
        code: "CURSOR_HIDDEN_DURING_TYPEIN",
        note: detail,
      });
    } catch {
      /* hang-safe */
    }
    try {
      console.warn(
        "[PLAYBACK_DIAG] cursor",
        "CURSOR_HIDDEN_DURING_TYPEIN",
        { phase, chars, ...dom }
      );
    } catch {
      /* ignore */
    }
  }
  return dom.visible;
}
