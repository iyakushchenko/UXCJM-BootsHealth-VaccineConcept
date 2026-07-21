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

/**
 * Default light-touch tween — CSS/Motion ease-in-out, no overshoot.
 * Keep the numeric bezier as the SSoT so non-Motion engines (camera scroll)
 * can evaluate the exact same curve rather than approximating it.
 */
export const MOTION_EASE_IN_OUT = [0.42, 0, 0.58, 1] as const;

function cubicBezierCoordinate(t: number, p1: number, p2: number): number {
  const inv = 1 - t;
  return 3 * inv * inv * t * p1 + 3 * inv * t * t * p2 + t * t * t;
}

/** Evaluate the shared ease-in-out cubic-bezier at timeline progress x. */
export function motionEaseInOutProgress(progress: number): number {
  const x = Math.min(1, Math.max(0, progress));
  if (x === 0 || x === 1) return x;
  let low = 0;
  let high = 1;
  // Deterministic bisection avoids Newton instability at shallow derivatives.
  for (let i = 0; i < 18; i += 1) {
    const mid = (low + high) / 2;
    if (cubicBezierCoordinate(mid, 0.42, 0.58) < x) low = mid;
    else high = mid;
  }
  return cubicBezierCoordinate((low + high) / 2, 0, 1);
}

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
