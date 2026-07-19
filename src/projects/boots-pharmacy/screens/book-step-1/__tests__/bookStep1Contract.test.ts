import { describe, expect, it } from "vitest";
import { PROJECT_SCREENS } from "@/projects/boots-pharmacy/screens/screens";
import {
  BOOK_STEP1_CHILD_INDEX,
  BOOK_STEP1_CHOSEN_SLOT_CLASS,
  BOOK_STEP1_REACT_SCREEN_ID,
  BOOK_STEP1_SCREEN_SELECTOR,
} from "../bookStep1Contract";

describe("bookStep1Contract", () => {
  it("matches Studio screen registry child index for Book Step 1", () => {
    const screen = PROJECT_SCREENS.find((s) =>
      /book - step 1/i.test(s.label)
    );
    expect(screen?.childIndex).toBe(BOOK_STEP1_CHILD_INDEX);
    expect(BOOK_STEP1_SCREEN_SELECTOR).toContain(
      `nth-child(${BOOK_STEP1_CHILD_INDEX})`
    );
    expect(BOOK_STEP1_CHOSEN_SLOT_CLASS).toBe("proto-chosen-slot");
    expect(BOOK_STEP1_REACT_SCREEN_ID).toBe("book-step-1");
  });
});
