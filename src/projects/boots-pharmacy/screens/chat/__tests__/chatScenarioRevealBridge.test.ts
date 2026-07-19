import { describe, expect, it, beforeEach } from "vitest";
import {
  clearChatScenarioReveal,
  getChatScenarioRevealState,
  publishChatScenarioReveal,
  resolveChatRevealedFrameCount,
} from "../chatScenarioRevealBridge";

describe("chatScenarioRevealBridge", () => {
  beforeEach(() => {
    clearChatScenarioReveal();
  });

  it("publishes engine visibleCount for React paint gating", () => {
    publishChatScenarioReveal({ active: true, visibleCount: 1 });
    expect(getChatScenarioRevealState()).toEqual({
      active: true,
      visibleCount: 1,
    });
    publishChatScenarioReveal({ active: true, visibleCount: 3 });
    expect(getChatScenarioRevealState().visibleCount).toBe(3);
  });

  it("resolveChatRevealedFrameCount never blanks and clamps to content", () => {
    expect(resolveChatRevealedFrameCount(0, 8, 1)).toBe(1);
    expect(resolveChatRevealedFrameCount(1, 8, 1)).toBe(1);
    expect(resolveChatRevealedFrameCount(2, 8, 1)).toBe(2);
    expect(resolveChatRevealedFrameCount(9, 8, 1)).toBe(8);
    expect(resolveChatRevealedFrameCount(4, 0, 1)).toBe(0);
  });
});
