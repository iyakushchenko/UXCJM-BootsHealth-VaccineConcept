/** @vitest-environment happy-dom */
import React, { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, it, vi } from "vitest";
import { StudioNavStudioSelect } from "@/app/nav/StudioNavStudioSelect";
(globalThis as typeof globalThis & { React: typeof React; IS_REACT_ACT_ENVIRONMENT: boolean }).React = React;
(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

afterEach(() => {
  document.body.innerHTML = "";
});

describe("StudioNavStudioSelect keyboard", () => {
  it("moves focus into the list and Escape closes + restores the trigger", async () => {
    const host = document.createElement("div");
    document.body.append(host);
    act(() => {
      createRoot(host).render(
        React.createElement(StudioNavStudioSelect, {
          options: [{ id: "a", label: "Alpha" }, { id: "b", label: "Beta" }],
          value: "a",
          onChange: vi.fn(),
          ariaLabel: "Project",
        })
      );
    });
    const trigger = host.querySelector<HTMLButtonElement>('[data-studio-action="project-select"]')!;
    act(() => {
      trigger.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowDown", bubbles: true }));
    });
    await act(async () => new Promise((resolve) => window.setTimeout(resolve, 250)));
    const selected = host.querySelector<HTMLButtonElement>('[role="option"][aria-selected="true"]')!;
    expect(document.activeElement).toBe(selected);
    act(() => {
      selected.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
    });
    expect(trigger.getAttribute("aria-expanded")).toBe("false");
    await act(async () => new Promise((resolve) => requestAnimationFrame(resolve)));
    expect(document.activeElement).toBe(trigger);
  });
});
