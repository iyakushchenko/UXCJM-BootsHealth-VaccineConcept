/** @vitest-environment happy-dom */
import React, { act } from "react";
import { createRoot } from "react-dom/client";
import { describe, expect, it } from "vitest";
import { ProjectPlaceholder } from "@/app/shell/ProjectPlaceholder";

(globalThis as typeof globalThis & { React: typeof React; IS_REACT_ACT_ENVIRONMENT: boolean }).React = React;
(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

describe("ProjectPlaceholder", () => {
  it("uses the registered project label in the engine empty state", () => {
    const host = document.createElement("div");
    document.body.append(host);
    act(() => createRoot(host).render(React.createElement(ProjectPlaceholder, { projectLabel: "Puma" })));
    const empty = host.querySelector<HTMLElement>("[data-studio-empty-project]");
    expect(empty?.dataset.projectLabel).toBe("Puma");
    expect(empty?.textContent).toContain("No pages are connected yet");
    expect(empty?.querySelector(".studio-empty-project__logo")).not.toBeNull();
  });
});
