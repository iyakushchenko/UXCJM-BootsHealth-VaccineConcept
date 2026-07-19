import { motion, MOTION_EASE_IN_OUT } from "@/uxds/motion";
import type { ChatThinkingBridgeMode } from "./chatThinkingBridge";

export type ChatThinkingBubbleProps = {
  mode: Exclude<ChatThinkingBridgeMode, "none">;
  generation: number;
};

export function ChatThinkingBubble({ mode, generation }: ChatThinkingBubbleProps) {
  const hint = mode === "hint" || mode === "playback";

  return (
    <motion.div
      key={`thinking-${generation}-${mode}`}
      className={`chat__thinking${hint ? " chat__thinking--hint" : ""}`}
      data-studio-chat-thinking="true"
      role="status"
      aria-live="polite"
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -4 }}
      transition={{ duration: 0.36, ease: MOTION_EASE_IN_OUT }}
    >
      <div className="chat__thinking-inner">
        <span className="chat__thinking-dots" aria-hidden="true">
          <motion.span
            animate={{ opacity: [0.35, 1, 0.35] }}
            transition={{ duration: 1, repeat: Infinity, ease: MOTION_EASE_IN_OUT }}
          />
          <motion.span
            animate={{ opacity: [0.35, 1, 0.35] }}
            transition={{
              duration: 1,
              repeat: Infinity,
              ease: MOTION_EASE_IN_OUT,
              delay: 0.15,
            }}
          />
          <motion.span
            animate={{ opacity: [0.35, 1, 0.35] }}
            transition={{
              duration: 1,
              repeat: Infinity,
              ease: MOTION_EASE_IN_OUT,
              delay: 0.3,
            }}
          />
        </span>
        <span className="chat__thinking-sr">SitePilot is thinking</span>
      </div>
    </motion.div>
  );
}
