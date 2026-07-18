import { beforeEach, describe, expect, it, vi } from "vitest";
import { resolveAvailIntent } from "@/projects/boots-pharmacy/wire/resolveAvailIntent";

const isProtoHeaderLoggedIn = vi.fn(() => false);

vi.mock("@/projects/boots-pharmacy/chrome/protoHeaderMount", () => ({
  isProtoHeaderLoggedIn: () => isProtoHeaderLoggedIn(),
}));

const AVAIL_START = { step: "start" as const };
const AVAIL_PICK_LIST = {
  step: "list" as const,
  query: "London",
  pickLocation: true,
};
const AVAIL_DATE_CHAT = {
  step: "date" as const,
  storeId: "covent",
  selectedDate: { month: "June", day: 25 },
};
const AVAIL_TIME_SLOT = {
  step: "time" as const,
  storeId: "covent",
  selectedDate: { month: "June", day: 25 },
  selectedTime: "16:30",
};
const AVAIL_DATE_WEEK = {
  step: "date" as const,
  storeId: "covent",
  selectedDate: { month: "June", day: 24 },
};

describe("resolveAvailIntent", () => {
  beforeEach(() => {
    isProtoHeaderLoggedIn.mockReturnValue(false);
  });

  it("passes pickLocation intents through unchanged", () => {
    expect(resolveAvailIntent(AVAIL_PICK_LIST, null)).toEqual(AVAIL_PICK_LIST);
  });

  it("downgrades date intents without storeId and no location to start", () => {
    expect(resolveAvailIntent({ step: "date" }, null)).toEqual(AVAIL_START);
  });

  it("allows date intents with explicit storeId without location gate", () => {
    expect(resolveAvailIntent(AVAIL_DATE_CHAT, null)).toEqual(AVAIL_DATE_CHAT);
  });

  it("allows time intents with explicit storeId without location gate", () => {
    expect(resolveAvailIntent(AVAIL_TIME_SLOT, null)).toEqual(AVAIL_TIME_SLOT);
  });

  it("resolves date step with chosen location", () => {
    const chosen = {
      name: "Covent Garden",
      address: "London",
      storeId: "covent",
    };
    expect(resolveAvailIntent(AVAIL_DATE_WEEK, chosen)).toEqual({
      ...AVAIL_DATE_WEEK,
      storeId: "covent",
    });
  });

  it("treats logged-in header as having location", () => {
    isProtoHeaderLoggedIn.mockReturnValue(true);
    expect(resolveAvailIntent(AVAIL_DATE_CHAT, null)).toEqual(AVAIL_DATE_CHAT);
  });
});
