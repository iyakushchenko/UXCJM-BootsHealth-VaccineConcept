import type { ReactNode } from "react";
import { motion, MOTION_EASE_IN_OUT } from "@/uxds/motion";

export type CommitPulseIconProps = {
  children: ReactNode;
  /** Bump this to replay the pulse (e.g. once per real commit landing). */
  pulseKey: number;
  className?: string;
};

/**
 * Reusable "just committed" celebration — brief scale-up-then-settle on the
 * icon a pending action just resolved into (bookmark saved, item added…).
 * Engine motion only: `framer-motion` via `@/uxds/motion`, no bespoke
 * `@keyframes`. Remounting on `pulseKey` change is what replays the
 * keyframe animation — a static `animate` prop only plays once on mount.
 */
export function CommitPulseIcon({
  children,
  pulseKey,
  className,
}: CommitPulseIconProps) {
  return (
    <motion.span
      key={pulseKey}
      className={className}
      style={{ display: "inline-flex" }}
      initial={{ scale: 1 }}
      animate={{ scale: [1, 1.32, 1] }}
      transition={{ duration: 0.32, ease: MOTION_EASE_IN_OUT }}
    >
      {children}
    </motion.span>
  );
}
