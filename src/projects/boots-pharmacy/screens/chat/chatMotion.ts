import { MOTION_EASE_IN_OUT } from "@/uxds/motion";

/**
 * Make `proto-chat-thinking-reveal`: translateY(8px) → 0 + opacity.
 * Shared pull-up for thinking exit→agent reply replace + bubble enter.
 */
export const CHAT_PULL_UP = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: 6 },
  transition: { duration: 0.4, ease: MOTION_EASE_IN_OUT },
} as const;
