/** @vitest-environment happy-dom */
import React from "react";
import { describe, expect, it } from "vitest";

(globalThis as typeof globalThis & { React: typeof React }).React = React;

describe("project registry content ownership", () => {
  it("keeps a known empty project empty instead of inheriting Boots pages", async () => {
    const { getProjectById, getProjectContent } = await import("@/projects/registry");
    const project = getProjectById("puma");
    expect(project?.label).toBe("UXDS - Larkin");
    expect(getProjectContent("puma")).toBe(project?.content);
    expect(getProjectContent("puma").PROJECT_SCREENS).toHaveLength(0);
  }, 10_000);
});
