/**
 * Observe-mode demo cursor follows the real user pointer while capturing.
 * Park / hide when paused, agent CONTROL, or session ends.
 */

import {
  isDemoCursorParked,
  parkDemoCursorAtRest,
  removeDemoCursor,
} from "@/app/scenario/demoCursor";

const CURSOR_CLASS = "proto-chat-demo-cursor";
const FOLLOW_ATTR = "data-studio-qa-observe-follow";

export type ObserveCursorFollowHandlers = {
  /** True while observe (or manual) is actively capturing. */
  shouldFollow: () => boolean;
};

function ensureFollowCursor(): HTMLElement | null {
  if (typeof document === "undefined") return null;
  let cursor = document.querySelector<HTMLElement>(`.${CURSOR_CLASS}`);
  if (!cursor) {
    cursor = document.createElement("div");
    cursor.className = CURSOR_CLASS;
    // Minimal arrow — full markup lives in demoCursor; empty div still tracks.
    cursor.innerHTML =
      '<svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M4 3l16 8.5-7 1.5-3 7z"/></svg>';
    document.body.appendChild(cursor);
  }
  cursor.setAttribute(FOLLOW_ATTR, "true");
  cursor.classList.remove("proto-chat-demo-cursor--parked");
  cursor.style.opacity = "1";
  cursor.style.pointerEvents = "none";
  cursor.style.zIndex = "2147483645";
  return cursor;
}

function writePos(cursor: HTMLElement, x: number, y: number): void {
  cursor.style.transition = "none";
  cursor.style.left = `${Math.round(x)}px`;
  cursor.style.top = `${Math.round(y)}px`;
}

/**
 * Bind mousemove → demo cursor follow. Returns unbind.
 * Does not fight CJM playback travel when shouldFollow is false.
 */
export function bindObservePointerCursorFollow(
  handlers: ObserveCursorFollowHandlers
): () => void {
  if (
    typeof document === "undefined" ||
    typeof window === "undefined" ||
    typeof document.addEventListener !== "function"
  ) {
    return () => undefined;
  }

  let raf = 0;
  let pending: { x: number; y: number } | null = null;

  const flush = () => {
    raf = 0;
    if (!pending) return;
    if (!handlers.shouldFollow()) return;
    const cursor = ensureFollowCursor();
    if (!cursor) return;
    writePos(cursor, pending.x, pending.y);
    pending = null;
  };

  const onMove = (event: MouseEvent) => {
    if (!handlers.shouldFollow()) return;
    pending = { x: event.clientX, y: event.clientY };
    if (!raf) raf = window.requestAnimationFrame(flush);
  };

  document.addEventListener("mousemove", onMove, { passive: true });

  return () => {
    document.removeEventListener("mousemove", onMove);
    if (raf) window.cancelAnimationFrame(raf);
    raf = 0;
    pending = null;
    const cursor = document.querySelector<HTMLElement>(
      `.${CURSOR_CLASS}[${FOLLOW_ATTR}="true"]`
    );
    if (cursor) {
      cursor.removeAttribute(FOLLOW_ATTR);
      // Only remove if we created a follow-only cursor and CJM isn't pinning.
      try {
        if (!isDemoCursorParked()) {
          /* leave in place for next CJM travel */
        }
      } catch {
        /* ignore */
      }
    }
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
    } else {
      void parkDemoCursorAtRest({ animate: false });
    }
  } catch {
    /* hang-safe */
  }
}
