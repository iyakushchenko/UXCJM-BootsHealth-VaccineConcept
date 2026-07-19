import { describe, expect, it } from "vitest";
import {
  handleProtoInputClick,
  isReactOwnedInputRow,
} from "../inputControls";

function mockEl(opts: {
  dataset?: Record<string, string>;
  name?: string;
  parent?: ReturnType<typeof mockEl> | null;
}): HTMLElement {
  const dataset = { ...(opts.dataset ?? {}) } as DOMStringMap;
  const el = {
    dataset,
    getAttribute(attr: string) {
      if (attr === "data-name") return opts.name ?? null;
      const key = attr.replace(/^data-/, "").replace(/-([a-z])/g, (_, c) => c.toUpperCase());
      return (dataset as Record<string, string>)[key] ?? null;
    },
    closest(selector: string) {
      if (
        selector === '[data-name="component.input.checkbox"]' &&
        opts.name === "component.input.checkbox"
      ) {
        return el;
      }
      if (
        selector === "[data-proto-react-screen]" &&
        (dataset.protoReactScreen || opts.parent?.dataset.protoReactScreen)
      ) {
        return opts.parent ?? el;
      }
      if (opts.parent) return opts.parent.closest(selector);
      return null;
    },
    querySelector() {
      return null;
    },
  };
  return el as unknown as HTMLElement;
}

describe("inputControls — React-owned / booster rows", () => {
  it("treats data-proto-react-owned and react-screen ancestors as React-owned", () => {
    const owned = mockEl({ dataset: { protoReactOwned: "true" } });
    expect(isReactOwnedInputRow(owned)).toBe(true);

    const host = mockEl({ dataset: { protoReactScreen: "book-step-1" } });
    const row = mockEl({
      name: "component.input.checkbox",
      parent: host,
    });
    expect(isReactOwnedInputRow(row)).toBe(true);

    const plain = mockEl({ name: "component.input.checkbox" });
    expect(isReactOwnedInputRow(plain)).toBe(false);
  });

  it("does not DOM-toggle booster checkboxes on click", () => {
    const row = mockEl({
      name: "component.input.checkbox",
      dataset: { protoBooster: "true", checkboxChecked: "false" },
    });
    const box = mockEl({ parent: row });

    expect(handleProtoInputClick(box)).toBe(false);
    expect(row.dataset.checkboxChecked).toBe("false");
  });

  it("does not DOM-toggle React-owned checkbox rows on click", () => {
    const row = mockEl({
      name: "component.input.checkbox",
      dataset: { protoReactOwned: "true", checkboxChecked: "false" },
    });
    const box = mockEl({ parent: row });

    expect(handleProtoInputClick(box)).toBe(false);
    expect(row.dataset.checkboxChecked).toBe("false");
  });
});
