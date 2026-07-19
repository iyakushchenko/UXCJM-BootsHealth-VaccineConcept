import { afterEach, describe, expect, it, vi } from "vitest";

import {
  JOURNEY_SCROLL_LOCK_CLASS,
  bindProtoJourneyScrollLock,
  isScrollNavigationKey,
} from "@/app/shell/journeyScrollLock";

function mockScrollEl() {
  const listeners = new Map<string, EventListener>();
  return {
    classList: {
      add: vi.fn(),
      remove: vi.fn(),
    },
    addEventListener: vi.fn((type: string, listener: EventListener) => {
      listeners.set(type, listener);
    }),
    removeEventListener: vi.fn((type: string, listener: EventListener) => {
      if (listeners.get(type) === listener) listeners.delete(type);
    }),
    contains: vi.fn(() => true),
    listener(type: string) {
      return listeners.get(type);
    },
  };
}

describe("journeyScrollLock", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("recognizes scroll navigation keys", () => {
    expect(isScrollNavigationKey("ArrowDown")).toBe(true);
    expect(isScrollNavigationKey("PageUp")).toBe(true);
    expect(isScrollNavigationKey(" ")).toBe(true);
    expect(isScrollNavigationKey("Enter")).toBe(false);
    expect(isScrollNavigationKey("Tab")).toBe(false);
  });

  it("adds journey lock class and removes it on cleanup", () => {
    vi.stubGlobal("window", {
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    });
    const scrollEl = mockScrollEl();

    const release = bindProtoJourneyScrollLock(
      scrollEl as unknown as HTMLElement
    );
    expect(scrollEl.classList.add).toHaveBeenCalledWith(
      JOURNEY_SCROLL_LOCK_CLASS
    );

    release();
    expect(scrollEl.classList.remove).toHaveBeenCalledWith(
      JOURNEY_SCROLL_LOCK_CLASS
    );
  });

  it("registers wheel and touchmove blockers with passive false", () => {
    vi.stubGlobal("window", {
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    });
    const scrollEl = mockScrollEl();

    bindProtoJourneyScrollLock(scrollEl as unknown as HTMLElement);

    expect(scrollEl.addEventListener).toHaveBeenCalledWith(
      "wheel",
      expect.any(Function),
      { passive: false }
    );
    expect(scrollEl.addEventListener).toHaveBeenCalledWith(
      "touchmove",
      expect.any(Function),
      { passive: false }
    );
  });
});
