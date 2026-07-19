import { describe, expect, it, vi } from "vitest";
import { RETREAT_SYNC_EVENT } from "@/app/scenario/retreatBridge";
import {
  BOOK_STEP2_RETREAT_DEFAULT_DATE,
  BOOK_STEP2_RETREAT_INTENT,
  formatBookStep2DateHeading,
  BOOK_STEP2_RETREAT_DEFAULT_EVENT,
  syncBookStep2RetreatDefaultDom,
} from "@/projects/boots-pharmacy/dom/bookStep2Calendar";
import { BOOK_DEFAULT_DATE } from "@/projects/boots-pharmacy/playback/book";

describe("bookStep2Calendar", () => {
  it("exposes June 24 as the wire retreat default date", () => {
    expect(BOOK_STEP2_RETREAT_DEFAULT_DATE).toEqual({ month: "June", day: 24 });
    expect(BOOK_DEFAULT_DATE).toEqual(BOOK_STEP2_RETREAT_DEFAULT_DATE);
  });

  it("formats the Book Step 2 date heading for June 24 2026", () => {
    expect(formatBookStep2DateHeading("June", 24)).toBe(
      "Wednesday, 24th June 2026"
    );
  });

  it("routes wire React sync through the universal retreat bridge", () => {
    expect(BOOK_STEP2_RETREAT_DEFAULT_EVENT).toBe(RETREAT_SYNC_EVENT);
    expect(BOOK_STEP2_RETREAT_INTENT).toBe("book-step2-default-date");
  });

  it("always dispatches retreat sync for React even when screen is absent", () => {
    const dispatchEvent = vi.fn();
    vi.stubGlobal("window", { dispatchEvent });
    vi.stubGlobal("document", { querySelector: vi.fn(() => null) });
    expect(syncBookStep2RetreatDefaultDom()).toBe(false);
    expect(dispatchEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        type: RETREAT_SYNC_EVENT,
        detail: expect.objectContaining({ intent: BOOK_STEP2_RETREAT_INTENT }),
      })
    );
    vi.unstubAllGlobals();
  });
});
