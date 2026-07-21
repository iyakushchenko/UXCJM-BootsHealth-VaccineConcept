/** @vitest-environment happy-dom */
import React, { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, it, vi } from "vitest";
import { StudioNavProductAbout } from "@/app/nav/StudioNavProductAbout";
import { getStudioRelease } from "@/app/shell/studioRelease";

(globalThis as typeof globalThis & { React: typeof React; IS_REACT_ACT_ENVIRONMENT: boolean }).React = React;
(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

afterEach(() => {
  vi.useRealTimers();
  document.body.innerHTML = "";
});

describe("StudioNavProductAbout", () => {
  it("opens after hover intent and closes with its only action", async () => {
    vi.useFakeTimers();
    const host = document.createElement("div");
    document.body.append(host);
    act(() => createRoot(host).render(React.createElement(StudioNavProductAbout)));
    const trigger = host.querySelector<HTMLButtonElement>('[data-studio-action="open-uxml-about"]')!;
    act(() => trigger.dispatchEvent(new PointerEvent("pointerover", { bubbles: true })));
    expect(document.querySelector('[data-studio-modal="uxml-about"]')).toBeNull();
    await act(async () => vi.advanceTimersByTime(180));
    expect(document.querySelector('[data-studio-modal="uxml-about"]')).not.toBeNull();
    expect(document.body.textContent).toContain("User Experience Modeling Lab");
    const release = getStudioRelease();
    expect(document.body.textContent).toContain(`Version v${release.version} · ${release.channel}`);
    expect(document.body.textContent).toContain("Igor Yakushchenko");
    expect(document.querySelector(".studio-nav-product-about__logo")).not.toBeNull();
    const close = document.querySelector<HTMLButtonElement>('[data-studio-action="close-uxml-about"]')!;
    act(() => close.click());
    await act(async () => vi.runAllTimers());
    expect(document.querySelector('[data-studio-modal="uxml-about"]')).toBeNull();
    expect(trigger.getAttribute("aria-expanded")).toBe("false");
  });

  it("is unavailable while browse navigation is locked", () => {
    const host = document.createElement("div");
    document.body.append(host);
    act(() => createRoot(host).render(React.createElement(StudioNavProductAbout, { disabled: true })));
    expect(host.querySelector<HTMLButtonElement>("button")?.disabled).toBe(true);
  });

  it("closes on Escape", async () => {
    vi.useFakeTimers();
    const host = document.createElement("div");
    document.body.append(host);
    act(() => createRoot(host).render(React.createElement(StudioNavProductAbout)));
    const trigger = host.querySelector<HTMLButtonElement>('[data-studio-action="open-uxml-about"]')!;
    act(() => trigger.click());
    expect(document.querySelector('[data-studio-modal="uxml-about"]')).not.toBeNull();
    act(() => document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", code: "Escape", bubbles: true })));
    await act(async () => vi.advanceTimersByTime(300));
    expect(document.querySelector('[data-studio-modal="uxml-about"]')).toBeNull();
    act(() => trigger.dispatchEvent(new PointerEvent("pointerover", { bubbles: true })));
    await act(async () => vi.advanceTimersByTime(300));
    expect(document.querySelector('[data-studio-modal="uxml-about"]')).toBeNull();
  });
});
