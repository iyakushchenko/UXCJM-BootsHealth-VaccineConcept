/** @vitest-environment happy-dom */
import { afterEach, describe, expect, it } from "vitest";
import {
  bridgeDemoPseudoSelector,
  DEMO_PSEUDO_BRIDGE_MAX_RULES,
  ensureDemoPseudoBridge,
  removeDemoPseudoBridge,
  shouldBridgeStyleSheet,
  splitSelectorsTopLevel,
} from "@/app/scenario/demoCursorPseudoBridge";

describe("splitSelectorsTopLevel", () => {
  it("keeps commas inside :is()", () => {
    expect(
      splitSelectorsTopLevel(
        '.host :is(button, [role="listbox"], [role="option"]):active:focus'
      )
    ).toEqual([
      '.host :is(button, [role="listbox"], [role="option"]):active:focus',
    ]);
  });

  it("splits only top-level commas", () => {
    expect(
      splitSelectorsTopLevel(".a:hover, .b:is(.x, .y):active, .c")
    ).toEqual([".a:hover", ".b:is(.x, .y):active", ".c"]);
  });
});

describe("bridgeDemoPseudoSelector", () => {
  it("mirrors :hover onto .proto-chat-cta--hover", () => {
    expect(bridgeDemoPseudoSelector(".proto-popup-close:hover")).toBe(
      ".proto-popup-close.proto-chat-cta--hover"
    );
  });

  it("mirrors :active onto .proto-chat-cta--pressed", () => {
    expect(
      bridgeDemoPseudoSelector(".proto-popup-close:active:not(:focus-visible)")
    ).toBe(".proto-popup-close.proto-chat-cta--pressed:not(:focus-visible)");
  });

  it("keeps descendant hover compounds", () => {
    expect(
      bridgeDemoPseudoSelector(".pdp__icon-hit:hover .pdp__heart-icon")
    ).toBe(".pdp__icon-hit.proto-chat-cta--hover .pdp__heart-icon");
  });

  it("bridges :is() lists without splitting inner commas", () => {
    expect(
      bridgeDemoPseudoSelector(
        '.studio-nav-panel-host :is(button, [role="listbox"], [role="option"]):active:focus'
      )
    ).toBe(
      '.studio-nav-panel-host :is(button, [role="listbox"], [role="option"]).proto-chat-cta--pressed:focus'
    );
  });

  it("bridges PDP secondary CTA hover", () => {
    expect(bridgeDemoPseudoSelector(".pdp__secondary:hover")).toBe(
      ".pdp__secondary.proto-chat-cta--hover"
    );
    expect(
      bridgeDemoPseudoSelector(".pdp__secondary:hover .pdp__secondary-icon")
    ).toBe(".pdp__secondary.proto-chat-cta--hover .pdp__secondary-icon");
  });

  it("skips :not(:hover) negatives", () => {
    expect(bridgeDemoPseudoSelector(".foo:not(:hover)")).toBeNull();
  });

  it("skips pseudo-element :hover (class cannot attach)", () => {
    expect(
      bridgeDemoPseudoSelector(
        ".studio-agent-testing-overlay__log::-webkit-scrollbar-thumb:hover"
      )
    ).toBeNull();
  });

  it("does not double-bridge already-mirrored selectors", () => {
    expect(
      bridgeDemoPseudoSelector(".proto-popup-close.proto-chat-cta--hover")
    ).toBeNull();
  });
});

describe("ensureDemoPseudoBridge", () => {
  afterEach(() => {
    removeDemoPseudoBridge();
    document
      .querySelectorAll("[data-test-hover-sheet]")
      .forEach((el) => el.remove());
  });

  it("injects bridged rules from document stylesheets", () => {
    const sheet = document.createElement("style");
    sheet.setAttribute("data-test-hover-sheet", "1");
    sheet.textContent = `.probe-hover-target:hover{color:#012169}.probe-hover-target:active{opacity:0.8}`;
    document.head.appendChild(sheet);

    ensureDemoPseudoBridge();
    const bridge = document.getElementById("studio-demo-pseudo-bridge");
    expect(bridge).toBeTruthy();
    expect(bridge?.sheet).toBeTruthy();
    const sels = Array.from(bridge!.sheet!.cssRules).map(
      (r) => (r as CSSStyleRule).selectorText
    );
    expect(sels).toContain(".probe-hover-target.proto-chat-cta--hover");
    expect(sels).toContain(".probe-hover-target.proto-chat-cta--pressed");
  });

  it("keeps later page rules when earlier :is() compounds are present", () => {
    const sheet = document.createElement("style");
    sheet.setAttribute("data-test-hover-sheet", "1");
    sheet.textContent = [
      '.host :is(button, [role="listbox"], [role="option"]):active:focus{outline:none}',
      ".pdp__secondary:hover{background:#c6e5e1}",
    ].join("");
    document.head.appendChild(sheet);

    ensureDemoPseudoBridge();
    const bridge = document.getElementById("studio-demo-pseudo-bridge");
    const sels = Array.from(bridge!.sheet!.cssRules).map(
      (r) => (r as CSSStyleRule).selectorText
    );
    expect(sels.some((s) => s.includes(":is(button"))).toBe(true);
    expect(sels).toContain(".pdp__secondary.proto-chat-cta--hover");
    // CSSOM must not stall — claimed count matches live rules.
    expect(Number(bridge?.getAttribute("data-studio-bridge-cssom"))).toBe(
      bridge!.sheet!.cssRules.length
    );
  });

  it("caps bridged rule count (Chrome hang guard)", () => {
    const sheet = document.createElement("style");
    sheet.setAttribute("data-test-hover-sheet", "1");
    const rules: string[] = [];
    for (let i = 0; i < DEMO_PSEUDO_BRIDGE_MAX_RULES + 40; i++) {
      rules.push(`.flood-hover-${i}:hover{color:red}`);
    }
    sheet.textContent = rules.join("");
    document.head.appendChild(sheet);

    ensureDemoPseudoBridge();
    const bridge = document.getElementById("studio-demo-pseudo-bridge");
    const count = Number(bridge?.getAttribute("data-studio-bridge-rules") ?? 0);
    expect(count).toBeLessThanOrEqual(DEMO_PSEUDO_BRIDGE_MAX_RULES);
    expect(count).toBeGreaterThan(0);
  });

  it("skips vendor stylesheet identities", () => {
    const fake = {
      href: "https://cdn.example/node_modules/framer-motion/dist/x.css",
      ownerNode: null,
    } as unknown as CSSStyleSheet;
    expect(shouldBridgeStyleSheet(fake)).toBe(false);
  });
});
