import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  dumpControlPanelLog,
  logControlPanel,
  registerControlPanelSnapshotProvider,
  resetControlPanelLogForTests,
} from "@/app/shell/protoControlPanelLog";

describe("protoControlPanelLog", () => {
  beforeEach(() => {
    resetControlPanelLogForTests();
    vi.spyOn(console, "log").mockImplementation(() => {});
    vi.spyOn(console, "warn").mockImplementation(() => {});
    registerControlPanelSnapshotProvider(() => ({
      beatId: "book-step2-date",
      touchpointKey: "beat:book-step2-date",
    }));
  });

  afterEach(() => {
    registerControlPanelSnapshotProvider(null);
    vi.restoreAllMocks();
  });

  it("logs transport actions with snapshot", () => {
    const entry = logControlPanel("transport:step-back", { fromBeat: "book-step2-time" });
    expect(entry.action).toBe("transport:step-back");
    expect(entry.snapshot?.beatId).toBe("book-step2-date");
    expect(console.log).toHaveBeenCalled();
  });

  it("warns on blocked interactions", () => {
    logControlPanel("transport:step-back", {
      blocked: true,
      blockReason: "canStepBack=false",
    });
    expect(console.warn).toHaveBeenCalled();
  });

  it("keeps ring buffer on window and supports dump", () => {
    vi.stubGlobal("window", { __protoControlPanelLog: undefined as unknown });
    logControlPanel("transport:play");
    logControlPanel("transport:step-forward");
    const dumped = dumpControlPanelLog();
    expect(dumped).toHaveLength(2);
    expect(window.__protoControlPanelLog).toHaveLength(2);
  });
});
