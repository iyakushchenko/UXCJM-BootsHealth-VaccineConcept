/**
 * Platform Motion entry — import from here, not raw `framer-motion` / `motion`.
 * Policy: docs/product/MOTION.md
 */
export {
  animate,
  AnimatePresence,
  easeInOut,
  motion,
  useReducedMotion,
  type AnimationPlaybackControls,
  type Transition,
} from "framer-motion";

/** Default light-touch tween — ease-in-out, no spring / back / overshoot. */
export const MOTION_EASE_IN_OUT = "easeInOut" as const;

export const motionEaseInOutTransition = {
  ease: MOTION_EASE_IN_OUT,
} as const;

/**
 * Platform content-load interim (real-life feel — not instant paint).
 * Use for screen refresh / first paint / listing reload. Do NOT invent
 * per-page timers — import this constant.
 */
export const STUDIO_CONTENT_LOAD_MS = 1500;

/**
 * Default enter / pull-up / camera co-travel duration (ms).
 * Appear + scroll finish together unless PO asks to remove a transition.
 */
export const STUDIO_ENTER_MS = 340;

/** Await content-load interim (abortable). */
export function waitStudioContentLoad(
  ms: number = STUDIO_CONTENT_LOAD_MS,
  shouldAbort?: () => boolean
): Promise<void> {
  return new Promise((resolve) => {
    const started = performance.now();
    const tick = () => {
      if (shouldAbort?.()) {
        resolve();
        return;
      }
      if (performance.now() - started >= ms) {
        resolve();
        return;
      }
      window.setTimeout(tick, 40);
    };
    window.setTimeout(tick, Math.min(40, ms));
  });
}
