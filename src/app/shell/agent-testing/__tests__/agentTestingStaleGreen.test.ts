/**
 * @vitest-environment happy-dom
 */
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  detectStaleGreenMismatches,
  formatStaleGreenLabel,
  noteStaleGreenIfChanged,
  resetStaleGreenForTests,
} from "@/app/shell/agent-testing/agentTestingStaleGreen";
import { registerControlPanelSnapshotProvider } from "@/app/shell/controlPanelLog";

describe("agentTestingStaleGreen", () => {
  afterEach(() => {
    resetStaleGreenForTests();
    registerControlPanelSnapshotProvider(null);
  });

  it("detects screen snap≠URL", () => {
    registerControlPanelSnapshotProvider(() => ({
      screenId: "plp",
      journeyMode: false,
      experience: "agentic",
    }));
    const m = detectStaleGreenMismatches(
      "?project=boots-pharmacy&screen=chat&cjm=off&experience=agentic"
    );
    expect(m.some((x) => x.field === "screen")).toBe(true);
  });

  it("logs once per mismatch key", () => {
    registerControlPanelSnapshotProvider(() => ({
      screenId: "plp",
      journeyMode: true,
      experience: "agentic",
    }));
    const search =
      "?project=boots-pharmacy&screen=chat&cjm=off&experience=agentic";
    const a = noteStaleGreenIfChanged(search);
    expect(a.amber).toBe(true);
    expect(a.logLabel).toMatch(/stale-green/);
    const b = noteStaleGreenIfChanged(search);
    expect(b.amber).toBe(true);
    expect(b.logLabel).toBeNull();
    expect(formatStaleGreenLabel(a.mismatches)).toContain("screen");
  });
});
