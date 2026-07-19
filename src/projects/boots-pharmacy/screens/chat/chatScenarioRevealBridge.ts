/**
 * Engine → React chat progressive disclosure.
 *
 * `useScenarioPlayback` visibleCount is the control point (beat/frame steps).
 * React Chat mounts the full thread for `collectSitePilotChatScenarioFrames`
 * but paints only frames with index < visibleCount — Make-parity step reveal.
 */

export type ChatScenarioRevealState = {
  /** site-pilot-chat scenario active (CJM or browse on chat tab). */
  active: boolean;
  /** Content frames to paint (finale virtual beat clamped by consumers). */
  visibleCount: number;
};

let state: ChatScenarioRevealState = {
  active: false,
  visibleCount: 0,
};

const listeners = new Set<() => void>();

export function getChatScenarioRevealState(): ChatScenarioRevealState {
  return state;
}

export function subscribeChatScenarioReveal(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function notify(): void {
  listeners.forEach((l) => l());
}

export function publishChatScenarioReveal(
  next: ChatScenarioRevealState
): void {
  if (
    state.active === next.active &&
    state.visibleCount === next.visibleCount
  ) {
    return;
  }
  state = {
    active: next.active,
    visibleCount: Math.max(0, next.visibleCount),
  };
  notify();
}

export function clearChatScenarioReveal(): void {
  if (!state.active && state.visibleCount === 0) return;
  state = { active: false, visibleCount: 0 };
  notify();
}

/** Clamp engine count onto scripted content frames (never blank on CJM entry). */
export function resolveChatRevealedFrameCount(
  engineVisibleCount: number,
  contentFrameTotal: number,
  minVisible = 1
): number {
  if (contentFrameTotal <= 0) return 0;
  if (!Number.isFinite(engineVisibleCount) || engineVisibleCount <= 0) {
    return Math.min(minVisible, contentFrameTotal);
  }
  return Math.max(
    minVisible,
    Math.min(Math.floor(engineVisibleCount), contentFrameTotal)
  );
}
