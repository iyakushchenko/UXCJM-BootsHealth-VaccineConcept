/** @vitest-environment happy-dom */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { STUDIO_CONTENT_LOAD_MS } from "@/uxds/motion";
import {
  bumpChatBrowseEntryReveal,
  runChatBrowseEntryReveal,
} from "../chatBrowseEntryReveal";
import {
  clearChatScenarioReveal,
  getChatScenarioRevealState,
  publishChatScenarioReveal,
} from "../chatScenarioRevealBridge";
import {
  clearChatThinkingBridge,
  getChatThinkingBridgeState,
  publishChatThinkingBridge,
} from "../chatThinkingBridge";
import { CHAT_THREAD_FRAMES } from "../chatThreadContent";

vi.mock("@/app/scenario/playbackScroll", () => ({
  scrollCameraToHostEnd: vi.fn(),
}));

import { scrollCameraToHostEnd } from "@/app/scenario/playbackScroll";

describe("runChatBrowseEntryReveal — CJM-off existing-chat load", () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    clearChatScenarioReveal();
    clearChatThinkingBridge();
    document.body.removeAttribute("data-studio-content-loading");
    vi.mocked(scrollCameraToHostEnd).mockClear();
  });

  afterEach(() => {
    bumpChatBrowseEntryReveal();
    document.body.removeAttribute("data-studio-content-loading");
    vi.useRealTimers();
  });

  it("holds empty (no thinking) for STUDIO_CONTENT_LOAD_MS then paints full thread", async () => {
    publishChatScenarioReveal({ active: true, visibleCount: 1 });
    publishChatThinkingBridge({ mode: "playback", anchorFrameId: "r0" });

    const done = runChatBrowseEntryReveal();

    // Sync start: blank + content-loading attr, thinking cleared.
    expect(getChatScenarioRevealState()).toEqual({
      active: false,
      visibleCount: 0,
    });
    expect(document.body.getAttribute("data-studio-content-loading")).toBe(
      "chat"
    );
    expect(getChatThinkingBridgeState().mode).toBe("none");

    // Mid-interim — still empty, not progressive q0/r0 build.
    await vi.advanceTimersByTimeAsync(STUDIO_CONTENT_LOAD_MS / 2);
    expect(getChatScenarioRevealState().visibleCount).toBe(0);
    expect(getChatThinkingBridgeState().mode).toBe("none");

    await vi.advanceTimersByTimeAsync(STUDIO_CONTENT_LOAD_MS / 2 + 80);
    const result = await done;

    expect(result).toEqual({
      ok: true,
      frames: CHAT_THREAD_FRAMES.length,
      aborted: false,
    });
    expect(getChatScenarioRevealState()).toEqual({
      active: false,
      visibleCount: CHAT_THREAD_FRAMES.length,
    });
    expect(document.body.getAttribute("data-studio-content-loading")).toBeNull();
    expect(getChatThinkingBridgeState().mode).toBe("none");
    // No column → no premature host-end camera.
    expect(scrollCameraToHostEnd).not.toHaveBeenCalled();
  });

  it("scrolls host-end only after React paints revealed frames (not sync on publish)", async () => {
    const col = document.createElement("div");
    document.body.appendChild(col);
    let painted = false;

    // Simulate React: nodes appear a few frames after publish.
    const getColumn = () => {
      if (
        !painted &&
        getChatScenarioRevealState().visibleCount >= CHAT_THREAD_FRAMES.length
      ) {
        // Defer paint — first getColumn after publish still empty.
        queueMicrotask(() => {
          if (painted) return;
          painted = true;
          for (let i = 0; i < CHAT_THREAD_FRAMES.length; i++) {
            const el = document.createElement("div");
            el.setAttribute("data-studio-chat-revealed", "true");
            col.appendChild(el);
          }
        });
      }
      return col;
    };

    const done = runChatBrowseEntryReveal({ getColumn });
    await vi.advanceTimersByTimeAsync(STUDIO_CONTENT_LOAD_MS + 80);

    // Drive rAF paint-wait loop.
    for (let i = 0; i < 30; i++) {
      await vi.advanceTimersByTimeAsync(16);
    }
    const result = await done;

    expect(result.ok).toBe(true);
    expect(scrollCameraToHostEnd).toHaveBeenCalledTimes(1);
    expect(scrollCameraToHostEnd).toHaveBeenCalledWith(
      col,
      expect.objectContaining({
        instant: false,
        skipHold: true,
        force: true,
        reason: "cjm-off existing-chat load settle",
      })
    );
    // Camera after paint — revealed nodes must exist when scroll fires.
    expect(
      col.querySelectorAll('[data-studio-chat-revealed="true"]').length
    ).toBe(CHAT_THREAD_FRAMES.length);

    col.remove();
  });

  it("aborts cleanly without dumping mid-load", async () => {
    const done = runChatBrowseEntryReveal({
      shouldAbort: () => true,
    });
    await vi.advanceTimersByTimeAsync(10);
    const result = await done;
    expect(result.aborted).toBe(true);
    expect(getChatScenarioRevealState().visibleCount).toBe(0);
  });
});

describe("resolveChatRevealedFrameCount — existing-chat blank interim", () => {
  it("allows minVisible 0 for content-load hold", async () => {
    const { resolveChatRevealedFrameCount } = await import(
      "../chatScenarioRevealBridge"
    );
    expect(resolveChatRevealedFrameCount(0, 8, 0)).toBe(0);
    expect(resolveChatRevealedFrameCount(8, 8, 0)).toBe(8);
  });
});
