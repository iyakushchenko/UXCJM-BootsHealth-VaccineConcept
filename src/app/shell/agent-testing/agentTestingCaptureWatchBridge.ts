/**
 * Overlay wiring for capture watch.
 * Manual/observe: OS cursor only — never bind demo/robo pointer-follow
 * (PO: dual cursor with CJM park = wrong UX).
 */

import { removeDemoCursor } from "@/app/scenario/demoCursor";
import { bindAgentTestingCaptureWatch } from "@/app/shell/agent-testing/agentTestingCaptureWatch";
import { stopObservePointerCursorFollow } from "@/app/shell/agent-testing/agentTestingObserveCursor";
import type { AgentTestingSessionKind } from "@/app/shell/agent-testing/agentTestingSession";
import type { AgentTestingLogEntry } from "@/app/shell/agent-testing/agentTestingTypes";

export type CaptureWatchBridgeOptions = {
  isActive: () => boolean;
  isSettling: () => boolean;
  isCapturePaused: () => boolean;
  getSessionKind: () => AgentTestingSessionKind;
  pushLogEntry: (entry: AgentTestingLogEntry) => void;
};

let captureWatchUnbind: (() => void) | null = null;
let observeCursorUnbind: (() => void) | null = null;

export function isCaptureInProgressBridge(
  opts: Pick<
    CaptureWatchBridgeOptions,
    "isActive" | "isSettling" | "isCapturePaused"
  >
): boolean {
  if (!opts.isActive() || opts.isSettling()) return false;
  return !opts.isCapturePaused();
}

/**
 * Manual / observe (user driving): hide demo/robo cursor — OS pointer only.
 * Agent CONTROL: leave CJM Play/SF robo cursor alone.
 */
function syncUserDrivingCursorPolicy(opts: CaptureWatchBridgeOptions): void {
  if (observeCursorUnbind) {
    try {
      observeCursorUnbind();
    } catch {
      /* hang-safe */
    }
    observeCursorUnbind = null;
  }
  const kind = opts.getSessionKind();
  // Never follow pointer with a second robo cursor (legacy observe-follow retired).
  stopObservePointerCursorFollow({ remove: false });
  if (
    opts.isActive() &&
    !opts.isSettling() &&
    (kind === "observe" || kind === "manual")
  ) {
    try {
      removeDemoCursor({ immediate: true });
    } catch {
      /* hang-safe */
    }
  }
}

export function unbindCaptureWatchBridge(): void {
  if (captureWatchUnbind) {
    try {
      captureWatchUnbind();
    } catch {
      /* hang-safe */
    }
    captureWatchUnbind = null;
  }
  if (observeCursorUnbind) {
    try {
      observeCursorUnbind();
    } catch {
      /* hang-safe */
    }
    observeCursorUnbind = null;
  }
}

export function syncCaptureWatchBridge(opts: CaptureWatchBridgeOptions): void {
  unbindCaptureWatchBridge();
  if (!opts.isActive() || opts.isSettling()) {
    syncUserDrivingCursorPolicy(opts);
    return;
  }
  captureWatchUnbind = bindAgentTestingCaptureWatch({
    isCapturing: () => isCaptureInProgressBridge(opts),
    onClick: (detail) => {
      opts.pushLogEntry({
        atMs: Date.now(),
        timeLabel: new Date().toLocaleTimeString("en-GB", { hour12: false }),
        label: detail.label,
        outcome: "ok",
        kind: "click",
        selector: detail.selector,
        chain: detail.chain,
        surface: detail.surface,
        dataStudioAction: detail.dataStudioAction,
        action: detail.dataStudioAction || detail.selector,
      });
    },
    onScreen: (label) => {
      opts.pushLogEntry({
        atMs: Date.now(),
        timeLabel: new Date().toLocaleTimeString("en-GB", { hour12: false }),
        label,
        outcome: "ok",
        kind: "nav",
      });
    },
  });
  syncUserDrivingCursorPolicy(opts);
}
