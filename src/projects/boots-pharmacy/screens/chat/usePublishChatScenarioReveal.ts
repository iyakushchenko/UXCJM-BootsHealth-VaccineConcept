import { useLayoutEffect, useRef } from "react";
import {
  getChatScenarioRevealState,
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
  const lastVisibleRef = useRef(1);

  useLayoutEffect(() => {
    const contentTotal = Math.max(0, playlistFrames - 1);
    const clamp = (n: number) =>
      Math.min(
        Math.max(1, n),
        contentTotal > 0 ? contentTotal : Math.max(1, n)
      );

    if (scenarioId !== "site-pilot-chat") {
      // Overlay / leave scenario: HOLD last paint count — never clear to 0
      // (avail beat wiped the thread behind the modal — PO).
      const hold = clamp(
        Math.max(
          lastVisibleRef.current,
          getChatScenarioRevealState().visibleCount
        )
      );
      lastVisibleRef.current = hold;
      publishChatScenarioReveal({
        active: false,
        visibleCount: hold,
      });
      return;
    }
    const visible = clamp(visibleCount);
    lastVisibleRef.current = visible;
    publishChatScenarioReveal({
      active: true,
      visibleCount: visible,
    });
  }, [scenarioId, visibleCount, playlistFrames]);
}
