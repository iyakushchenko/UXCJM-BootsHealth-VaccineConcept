import { describe, expect, it, vi, afterEach } from "vitest";
import {
  EPHEMERAL_QUERY_KEYS,
  PROTO_HUB_SCREEN_ID,
  hasEphemeralStudioQuery,
  parseStudioUrl,
  resolveNavFromScreenId,
  resolveScreenIdFromNav,
  serializeStudioUrl,
  stripEphemeralStudioQuery,
  writeStudioUrl,
} from "@/app/shell/protoStudioUrl";

const SCREENS = [
  { screenId: "home", childIndex: 11 },
  { screenId: "chat", childIndex: 10 },
  { screenId: "book-step-1", childIndex: 7 },
  { screenId: "book-step-2", childIndex: 4 },
  { screenId: "book-step-3", childIndex: 3 },
] as const;

describe("protoStudioUrl", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("parses and serializes project + screen (+ optional persona/mode)", () => {
    const parsed = parseStudioUrl(
      "?project=boots-pharmacy&screen=book-step-2&persona=sarah-jenkins&mode=agentic-cjm&proof=junk"
    );
    expect(parsed).toEqual({
      projectId: "boots-pharmacy",
      screenId: "book-step-2",
      personaId: "sarah-jenkins",
      modeId: "agentic-cjm",
    });
    expect(serializeStudioUrl(parsed)).toBe(
      "?project=boots-pharmacy&screen=book-step-2&persona=sarah-jenkins&mode=agentic-cjm"
    );
  });

  it("normalizes screen aliases", () => {
    expect(parseStudioUrl("?screen=book-step2").screenId).toBe("book-step-2");
    expect(parseStudioUrl("?screen=onboarding").screenId).toBe(PROTO_HUB_SCREEN_ID);
    expect(parseStudioUrl("?screen=Agentic-Home").screenId).toBe("home");
  });

  it("resolves nav ↔ screenId for hub and book steps", () => {
    expect(resolveScreenIdFromNav({ hubOpen: true, current: 0, screens: SCREENS })).toBe(
      PROTO_HUB_SCREEN_ID
    );
    expect(
      resolveScreenIdFromNav({ hubOpen: false, current: 3, screens: SCREENS })
    ).toBe("book-step-2");

    expect(resolveNavFromScreenId("hub", SCREENS)).toEqual({
      hubOpen: true,
      current: 0,
      screenId: "hub",
    });
    expect(resolveNavFromScreenId("book-step-2", SCREENS)).toEqual({
      hubOpen: false,
      current: 3,
      screenId: "book-step-2",
    });
    expect(resolveNavFromScreenId("nope", SCREENS)).toBeNull();
  });

  it("detects ephemeral proof leftovers", () => {
    expect(hasEphemeralStudioQuery("?proof=unmount-race")).toBe(true);
    expect(hasEphemeralStudioQuery("?project=boots-pharmacy")).toBe(false);
    expect(EPHEMERAL_QUERY_KEYS).toContain("proof");
  });

  it("stripEphemeralStudioQuery removes proof via replaceState", () => {
    const replaceState = vi.fn();
    vi.stubGlobal("window", {
      location: {
        href: "http://localhost:5173/?proof=unmount-race&project=boots-pharmacy&screen=home",
        pathname: "/",
        search: "?proof=unmount-race&project=boots-pharmacy&screen=home",
        hash: "",
      },
      history: { state: null, replaceState },
    });

    expect(stripEphemeralStudioQuery()).toBe(true);
    expect(replaceState).toHaveBeenCalledTimes(1);
    const next = replaceState.mock.calls[0][2] as string;
    expect(next).toBe("/?project=boots-pharmacy&screen=home");
    expect(next).not.toContain("proof");
  });

  it("writeStudioUrl replaces bar and drops ephemeral keys", () => {
    const replaceState = vi.fn();
    vi.stubGlobal("window", {
      location: {
        href: "http://localhost:5173/?proof=stale&screen=home",
        pathname: "/",
        search: "?proof=stale&screen=home",
        hash: "",
      },
      history: { state: null, replaceState, pushState: vi.fn() },
    });

    const search = writeStudioUrl({
      projectId: "boots-pharmacy",
      screenId: "book-step-2",
    });
    expect(search).toBe("?project=boots-pharmacy&screen=book-step-2");
    expect(replaceState).toHaveBeenCalled();
    const next = replaceState.mock.calls[0][2] as string;
    expect(next).toBe("/?project=boots-pharmacy&screen=book-step-2");
    expect(next).not.toContain("proof");
  });
});
