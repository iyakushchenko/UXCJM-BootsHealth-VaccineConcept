/**
 * Observe-mode cursor helpers (legacy pointer-follow retired).
 * Manual/observe = OS cursor only; agent CONTROL / Play owns the robo cursor.
 */

import {
  isDemoCursorParked,
  parkDemoCursorAtRest,
  removeDemoCursor,
} from "@/app/scenario/demoCursor";

const CURSOR_CLASS = "proto-chat-demo-cursor";
const FOLLOW_ATTR = "data-studio-qa-observe-follow";

export type ObserveCursorFollowHandlers = {
  /** @deprecated Follow disabled — always treat as false. */
  shouldFollow: () => boolean;
};

/**
 * @deprecated PO 2026-07-20: dual cursor with OS pointer is wrong for manual/observe.
 * No-op bind — returns unbind that cleans any leftover follow attrs.
 */
export function bindObservePointerCursorFollow(
  _handlers: ObserveCursorFollowHandlers
): () => void {
  return () => {
    stopObservePointerCursorFollow({ remove: true });
  };
}

/** Park / drop observe follow cursor when leaving observe capture. */
export function stopObservePointerCursorFollow(options?: {
  remove?: boolean;
}): void {
  if (typeof document === "undefined") return;
  const cursor = document.querySelector<HTMLElement>(
    `.${CURSOR_CLASS}[${FOLLOW_ATTR}="true"]`
  );
  if (cursor && typeof cursor.removeAttribute === "function") {
    cursor.removeAttribute(FOLLOW_ATTR);
  }
  try {
    if (options?.remove) {
      removeDemoCursor({ immediate: true });
    } else if (isDemoCursorParked()) {
      void parkDemoCursorAtRest({ force: true, reason: "observe-stop" });
    } else {
      removeDemoCursor({ immediate: true });
    }
  } catch {
    /* hang-safe */
  }
}
