import { useLayoutEffect } from "react";
import {
  clearChatScenarioReveal,
  publishChatScenarioReveal,
} from "./chatScenarioRevealBridge";

/**
 * Wire `useScenarioPlayback.visibleCount` into the React Chat paint bridge.
 * Keeps App.tsx thin; engine remains the control point.
 */
export function usePublishChatScenarioReveal(
  scenarioId: string | undefined,
  visibleCount: number,
  /** Stable playlist size including virtual finale (DEFAULT_CHAT_SCENARIO_FRAMES). */
  playlistFrames: number
): void {
  useLayoutEffect(() => {
    if (scenarioId !== "site-pilot-chat") {
      clearChatScenarioReveal();
      return;
    }
    const contentTotal = Math.max(0, playlistFrames - 1);
    const visible = Math.min(
      Math.max(1, visibleCount),
      contentTotal > 0 ? contentTotal : Math.max(1, visibleCount)
    );
    publishChatScenarioReveal({
      active: true,
      visibleCount: visible,
    });
  }, [scenarioId, visibleCount, playlistFrames]);
}
