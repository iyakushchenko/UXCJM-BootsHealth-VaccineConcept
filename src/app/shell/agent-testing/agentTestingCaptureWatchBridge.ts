/**
 * Overlay wiring for capture watch + observe pointer follow.
 * Kept out of agentTestingOverlay.ts to stay under hygiene ceiling.
 */

import { bindAgentTestingCaptureWatch } from "@/app/shell/agent-testing/agentTestingCaptureWatch";
import {
  bindObservePointerCursorFollow,
  stopObservePointerCursorFollow,
} from "@/app/shell/agent-testing/agentTestingObserveCursor";
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

function syncObserveCursorFollow(opts: CaptureWatchBridgeOptions): void {
  if (observeCursorUnbind) {
    try {
      observeCursorUnbind();
    } catch {
      /* hang-safe */
    }
    observeCursorUnbind = null;
  }
  const kind = opts.getSessionKind();
  const follow =
    opts.isActive() &&
    !opts.isSettling() &&
    !opts.isCapturePaused() &&
    (kind === "observe" || kind === "manual");
  if (!follow) {
    stopObservePointerCursorFollow({ remove: kind === "agent" });
    return;
  }
  observeCursorUnbind = bindObservePointerCursorFollow({
    shouldFollow: () =>
      opts.isActive() &&
      !opts.isSettling() &&
      !opts.isCapturePaused() &&
      (opts.getSessionKind() === "observe" ||
        opts.getSessionKind() === "manual"),
  });
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
    syncObserveCursorFollow(opts);
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
  syncObserveCursorFollow(opts);
}
