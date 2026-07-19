import { describe, expect, it } from "vitest";
import {
  INDEX_PLP,
  PROJECT_SCREENS,
} from "@/projects/boots-pharmacy/screens/screens";
import {
  DEFAULT_PLP_FILTERS,
  filterPlpCatalog,
  isPlpFiltersDirty,
  togglePlpFilterValue,
} from "../plpCatalog";
import {
  PLP_CHILD_INDEX,
  PLP_REACT_SCREEN_ID,
  PLP_SCREEN_SELECTOR,
} from "../plpContract";

describe("plpContract", () => {
  it("matches Studio screen registry child index for PLP", () => {
    const screen = PROJECT_SCREENS.find((s) => /plp\. vaccinations/i.test(s.label));
    expect(screen?.childIndex).toBe(PLP_CHILD_INDEX);
    expect(screen?.screenId).toBe(PLP_REACT_SCREEN_ID);
    expect(INDEX_PLP).toBe(
      PROJECT_SCREENS.findIndex((s) => s.childIndex === PLP_CHILD_INDEX)
    );
    expect(PLP_SCREEN_SELECTOR).toContain(`nth-child(${PLP_CHILD_INDEX})`);
    expect(PLP_REACT_SCREEN_ID).toBe("plp");
  });
});

describe("plpCatalog filters", () => {
  it("defaults to individual jabs and not dirty", () => {
    expect(DEFAULT_PLP_FILTERS.showBundles).toBe(false);
    expect(isPlpFiltersDirty(DEFAULT_PLP_FILTERS)).toBe(false);
    expect(filterPlpCatalog(DEFAULT_PLP_FILTERS).length).toBeGreaterThan(0);
    expect(
      filterPlpCatalog(DEFAULT_PLP_FILTERS).every((item) => item.kind === "jab")
    ).toBe(true);
  });

  it("switches to bundles and marks dirty", () => {
    const bundles = filterPlpCatalog({
      ...DEFAULT_PLP_FILTERS,
      showBundles: true,
    });
    expect(bundles.length).toBeGreaterThan(0);
    expect(bundles.every((item) => item.kind === "bundle")).toBe(true);
    expect(
      isPlpFiltersDirty({ ...DEFAULT_PLP_FILTERS, showBundles: true })
    ).toBe(true);
  });

  it("narrows by disease checkbox", () => {
    const next = togglePlpFilterValue(
      DEFAULT_PLP_FILTERS,
      "diseases",
      "Chickenpox"
    );
    const items = filterPlpCatalog(next);
    expect(items.some((item) => /chickenpox/i.test(item.title))).toBe(true);
    expect(items.every((item) => item.diseases.includes("Chickenpox"))).toBe(
      true
    );
  });
});
