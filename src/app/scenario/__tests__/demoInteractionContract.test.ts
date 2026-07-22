/** @vitest-environment happy-dom */
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  hasDemoInteractionContract,
  isAlreadySelectedNoopTarget,
  readDemoInteractionState,
  resolveDemoTargetPoint,
  waitForDemoInteractionStateChange,
} from "@/app/scenario/demoInteractionContract";

describe("demoInteractionContract", () => {
  afterEach(() => {
    document.body.innerHTML = "";
    vi.restoreAllMocks();
  });

  it("rejects selected idempotent options but allows checked toggles", () => {
    const date = document.createElement("button");
    date.dataset.studioCalSelected = "true";
    const checkbox = document.createElement("button");
    checkbox.dataset.checkboxChecked = "true";
    expect(isAlreadySelectedNoopTarget(date)).toBe(true);
    expect(isAlreadySelectedNoopTarget(checkbox)).toBe(false);
  });

  it("does not treat an arbitrary visible box as an action", () => {
    const ghost = document.createElement("div");
    const action = document.createElement("button");
    document.body.append(ghost, action);
    expect(hasDemoInteractionContract(ghost)).toBe(false);
    expect(hasDemoInteractionContract(action)).toBe(true);
  });

  it("reads and verifies React-style checkbox state", async () => {
    const button = document.createElement("button");
    const box = document.createElement("span");
    box.dataset.checkboxChecked = "false";
    button.appendChild(box);
    document.body.appendChild(button);
    const before = readDemoInteractionState(button);
    expect(before).toMatchObject({ kind: "checkbox", value: false });
    window.setTimeout(() => {
      box.dataset.checkboxChecked = "true";
    }, 10);
    expect(await waitForDemoInteractionStateChange(button, before!, 120)).toBe(true);
  });

  it("treats aria-pressed controls as stateful toggles", () => {
    const bookmark = document.createElement("button");
    bookmark.setAttribute("aria-pressed", "false");
    expect(readDemoInteractionState(bookmark)).toMatchObject({
      kind: "checkbox",
      value: false,
    });
    expect(isAlreadySelectedNoopTarget(bookmark)).toBe(false);
  });

  it("aims at visible link text instead of an empty full-width centre", () => {
    const link = document.createElement("a");
    link.href = "#details";
    link.textContent = "Vaccine details";
    document.body.appendChild(link);
    vi.spyOn(link, "getBoundingClientRect").mockReturnValue({
      left: 0,
      top: 10,
      right: 600,
      bottom: 50,
      width: 600,
      height: 40,
      x: 0,
      y: 10,
      toJSON() {},
    });
    vi.spyOn(document, "createRange").mockReturnValue({
      selectNodeContents: vi.fn(),
      getClientRects: () => [
        { left: 12, top: 18, right: 132, bottom: 38, width: 120, height: 20 },
      ],
    } as unknown as Range);
    expect(resolveDemoTargetPoint(link)).toEqual({ x: 72, y: 28 });
  });
});
