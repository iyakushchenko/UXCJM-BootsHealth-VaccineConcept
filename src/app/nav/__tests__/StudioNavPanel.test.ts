/** @vitest-environment happy-dom */
import React, { act } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, it, vi } from "vitest";
(globalThis as typeof globalThis & { React: typeof React; IS_REACT_ACT_ENVIRONMENT: boolean }).React = React;
(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

vi.mock("@/app/nav/studioNavZoom", () => ({ useStudioNavZoom: vi.fn() }));
import StudioNavPanel from "@/app/nav/StudioNavPanel";

afterEach(() => {
  document.body.innerHTML = "";
  vi.restoreAllMocks();
});

function renderPanel(lockedOrOptions: boolean | { screens: []; hubOpen: true }) {
  const locked = typeof lockedOrOptions === "boolean" ? lockedOrOptions : false;
  const screens = typeof lockedOrOptions === "boolean"
    ? [{ label: "One", childIndex: 1 }]
    : lockedOrOptions.screens;
  const hubOpen = typeof lockedOrOptions === "boolean" ? false : lockedOrOptions.hubOpen;
  const host = document.createElement("div");
  document.body.append(host);
  const onOpenHub = vi.fn();
  const onReset = vi.fn();
  act(() => {
    createRoot(host).render(
      React.createElement(StudioNavPanel, {
        screens,
        hubLabel: "Onboarding",
        current: 0,
        hubOpen,
        navLabel: "One",
        isStudioPristine: false,
        navBrowseLocked: locked,
        contentRef: { current: null },
        tabsScrollRef: { current: null },
        tabBtnRefs: { current: [] },
        onOpenHub,
        onGo: vi.fn(),
        onReset,
        projectSelect: React.createElement("button", { "data-studio-action": "project-select" }, "Project"),
        projectId: "test-project",
        projectLabel: "Test project",
      })
    );
  });
  return { host, onOpenHub, onReset };
}

describe("StudioNavPanel lock truth", () => {
  it("renders an honest zero-page shell without a 0 / 0 counter or page controls", () => {
    renderPanel({ screens: [], hubOpen: true });
    expect(document.querySelectorAll(".studio-nav-tab")).toHaveLength(0);
    expect(document.querySelector(".studio-nav-status-bar__position")).toBeNull();
    expect(document.querySelector('[data-studio-action="nav-previous"]')).toBeNull();
    expect(document.querySelector('[data-studio-action="nav-next"]')).toBeNull();
    expect(document.querySelector('[data-studio-action="nav-hub"]')).not.toBeNull();
  });
  it("natively locks Hub and hides Reset during CJM/AIR", () => {
    const { host, onOpenHub, onReset } = renderPanel(true);
    const hubs = host.querySelectorAll<HTMLButtonElement>('[data-studio-action="nav-hub"]');
    expect(hubs).toHaveLength(2);
    hubs.forEach((button) => {
      expect(button.disabled).toBe(true);
      button.click();
    });
    const reset = host.querySelector<HTMLButtonElement>('[data-studio-action="nav-reset"]');
    expect(reset).toBeNull();
    reset?.click();
    expect(onOpenHub).not.toHaveBeenCalled();
    expect(onReset).not.toHaveBeenCalled();
  });

  it("keeps Hub available in free browse", () => {
    const { host, onOpenHub } = renderPanel(false);
    host.querySelector<HTMLButtonElement>('[data-studio-action="nav-hub"]')?.click();
    expect(onOpenHub).toHaveBeenCalledOnce();
  });

  it("orders UXML, Project, delimiter, Hub, then scrollable page tabs", () => {
    const { host } = renderPanel(false);
    const row = host.querySelector(".studio-nav-tabs-row")!;
    expect([...row.children].map((node) => (node as HTMLElement).className)).toEqual([
      "studio-nav-tabs-prefix",
      "studio-nav-tabs",
      "studio-nav-version",
    ]);
    const prefix = host.querySelector(".studio-nav-tabs-prefix")!;
    expect([...prefix.children].map((node) => (node as HTMLElement).className)).toEqual([
      "studio-nav-product-mark",
      "studio-nav-tabs-project",
      "studio-nav-tabs-divider",
      "studio-nav-logo-btn",
    ]);
    expect(host.querySelectorAll('[data-studio-action="project-select"]')).toHaveLength(1);
    expect(host.querySelector('[data-studio-action="open-uxml-about"]')?.textContent).toBe("UXML");
  });
});
