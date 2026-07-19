import { afterEach, describe, expect, it, vi } from "vitest";
import { runMcpPageProbe } from "@/app/shell/studioMcpPageProbe";

vi.mock("@/app/scenario/demoCursor", () => ({
  simulateDemoPointerClick: vi.fn(async () => true),
}));

vi.mock("@/app/shell/agentTestingOverlay", () => ({
  startAgentTestingOverlay: vi.fn(),
  stopAgentTestingOverlay: vi.fn(),
  logAgentTestingOverlay: vi.fn(),
}));

vi.mock("@/app/shell/playbackCursorDiagnostic", () => ({
  enableCursorQaEyes: vi.fn(),
  disableCursorQaEyes: vi.fn(),
}));

describe("runMcpPageProbe", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("fails clearly when screen has no probe recipe", async () => {
    vi.stubGlobal("window", {
      location: {
        href: "http://localhost:5173/?project=boots-pharmacy&screen=hub",
        search: "?project=boots-pharmacy&screen=hub",
      },
    });
    vi.stubGlobal("document", {
      querySelector: () => null,
    });

    const result = await runMcpPageProbe({
      screenId: "hub",
      reload: false,
    });
    expect(result.pass).toBe(false);
    expect(result.checks.some((c) => c.id === "probe-recipe" && !c.pass)).toBe(
      true
    );
  });

  it("passes PLP recipe when React hosts and CTAs resolve", async () => {
    const host = { tagName: "DIV" };
    const checkbox = { tagName: "BUTTON" };
    const reset = { tagName: "BUTTON" };
    const quick = { tagName: "BUTTON" };
    const book = { tagName: "BUTTON" };

    vi.stubGlobal("window", {
      location: {
        href: "http://localhost:5173/?project=boots-pharmacy&screen=plp",
        search: "?project=boots-pharmacy&screen=plp",
      },
    });
    vi.stubGlobal("document", {
      querySelector: (sel: string) => {
        if (sel === '[data-studio-react-screen="plp"]') return host;
        if (sel.includes("button[data-name=\"component.plp.filter.checkbox.item\"]"))
          return checkbox;
        if (sel.includes("button[data-studio-plp-reset-filters")) return reset;
        if (sel.includes("button[data-studio-quick-view")) return quick;
        if (sel.includes("button[data-studio-action=\"plp-book-now\"]"))
          return book;
        return null;
      },
    });

    const result = await runMcpPageProbe({
      screenId: "plp",
      reload: false,
    });
    expect(result.screenId).toBe("plp");
    expect(result.checks.find((c) => c.id === "plp-host")?.pass).toBe(true);
    expect(result.checks.find((c) => c.id === "url-screen")?.pass).toBe(true);
    expect(result.pass).toBe(true);
  });
});
