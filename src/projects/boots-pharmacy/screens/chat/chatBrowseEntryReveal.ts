/**
 * CJM-off chat — load an *existing* thread (not simulate creation).
 * Platform content-load interim → paint full thread → smooth camera to bottom.
 * No per-reply thinking / creation simulation.
 */

import { scrollCameraToHostEnd } from "@/app/scenario/playbackScroll";
import { playbackDiagLog } from "@/app/shell/playbackDiag";
import {
  STUDIO_CONTENT_LOAD_MS,
  STUDIO_ENTER_MS,
  waitStudioContentLoad,
} from "@/uxds/motion";
import {
  getChatScenarioRevealState,
  publishChatScenarioReveal,
} from "@/projects/boots-pharmacy/screens/chat/chatScenarioRevealBridge";
import { clearChatThinkingBridge } from "@/projects/boots-pharmacy/screens/chat/chatThinkingBridge";
import { CHAT_THREAD_FRAMES } from "@/projects/boots-pharmacy/screens/chat/chatThreadContent";

export type ChatBrowseEntryRevealOptions = {
  getColumn?: () => HTMLElement | null;
  shouldAbort?: () => boolean;
};

let browseEntryGeneration = 0;

/** Cancel in-flight browse entry (URL change / unmount). */
export function bumpChatBrowseEntryReveal(): void {
  browseEntryGeneration += 1;
}

function afterNextPaint(): Promise<void> {
  return new Promise((resolve) => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => resolve());
    });
  });
}

/**
 * Publish updates the reveal bridge sync, but React paints the full thread on
 * the next commit. Starting host-end before that commit sees scrollHeight≈0
 * and animateScrollTo early-exits (distance < 2) — no camera motion.
 * Wait until revealed nodes exist (or paint frames elapse), then one extra
 * frame so scrollHeight includes laid-out bubbles — same beat as ChatScreen
 * pull-up co-travel ("next frame so layout has the new bubble").
 */
async function waitBrowseEntryThreadPainted(
  getColumn: (() => HTMLElement | null) | undefined,
  expectedFrames: number,
  aborted: () => boolean
): Promise<HTMLElement | null> {
  if (!getColumn) return null;
  const maxRafs = 90;
  for (let i = 0; i < maxRafs; i++) {
    if (aborted()) return null;
    const col = getColumn() ?? null;
    if (col) {
      const painted = col.querySelectorAll(
        '[data-studio-chat-revealed="true"]'
      ).length;
      if (painted >= expectedFrames) {
        await afterNextPaint();
        return aborted() ? null : col;
      }
    }
    await new Promise<void>((r) => requestAnimationFrame(() => r()));
  }
  return aborted() ? null : (getColumn() ?? null);
}

/**
 * Existing-chat load: interim → full thread → smooth scroll-to-bottom.
 * No thinking on r0/r1/….
 */
export async function runChatBrowseEntryReveal(
  options?: ChatBrowseEntryRevealOptions
): Promise<{ ok: boolean; frames: number; aborted: boolean }> {
  const gen = ++browseEntryGeneration;
  const total = CHAT_THREAD_FRAMES.length;
  const aborted = () =>
    gen !== browseEntryGeneration || options?.shouldAbort?.() === true;

  playbackDiagLog(
    "info",
    `chat-browse-entry — existing chat load interim ${STUDIO_CONTENT_LOAD_MS}ms → ${total} frames`
  );

  // No creation / thinking chrome — empty hold then full saved thread.
  clearChatThinkingBridge();
  publishChatScenarioReveal({ active: false, visibleCount: 0 });
  try {
    document.body.setAttribute("data-studio-content-loading", "chat");
  } catch {
    /* hang-safe */
  }

  await waitStudioContentLoad(STUDIO_CONTENT_LOAD_MS, aborted);
  if (aborted()) {
    try {
      document.body.removeAttribute("data-studio-content-loading");
    } catch {
      /* hang-safe */
    }
    return { ok: false, frames: 0, aborted: true };
  }

  clearChatThinkingBridge();
  publishChatScenarioReveal({ active: false, visibleCount: total });
  try {
    document.body.removeAttribute("data-studio-content-loading");
  } catch {
    /* hang-safe */
  }

  // Co-travel with reveal: wait for React paint, then eased host-end camera.
  const col = await waitBrowseEntryThreadPainted(
    options?.getColumn,
    total,
    aborted
  );
  if (aborted()) {
    return { ok: false, frames: 0, aborted: true };
  }
  if (col) {
    scrollCameraToHostEnd(col, {
      instant: false,
      durationMs: STUDIO_ENTER_MS,
      skipHold: true,
      force: true,
      reason: "cjm-off existing-chat load settle",
    });
  }

  const finalCount = getChatScenarioRevealState().visibleCount;
  const ok = finalCount >= total;
  playbackDiagLog(
    ok ? "info" : "warn",
    `chat-browse-entry done — existing chat visible=${finalCount}/${total}`
  );
  return { ok, frames: finalCount, aborted: false };
}
