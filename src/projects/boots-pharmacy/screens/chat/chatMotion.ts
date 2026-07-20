import { MOTION_EASE_IN_OUT } from "@/uxds/motion";

/**
 * Quality Motion pull-up for new bubbles / thinking → reply.
 * Stronger than Make's 8px so progressive CJM reads as rise, not flat appear.
 * Exit y kept small + duration shorter for faster leave-chat handoff.
 */
export const CHAT_PULL_UP = {
  initial: { opacity: 0, y: 22 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: 6 },
  transition: { duration: 0.38, ease: MOTION_EASE_IN_OUT },
} as const;
