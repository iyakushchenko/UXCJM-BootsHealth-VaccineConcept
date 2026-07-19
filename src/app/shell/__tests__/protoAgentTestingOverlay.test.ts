import { afterEach, describe, expect, it, vi } from "vitest";
import {
  isAgentTestingOverlayActive,
  startAgentTestingOverlay,
  stopAgentTestingOverlay,
  uninstallAgentTestingOverlayApi,
} from "@/app/shell/protoAgentTestingOverlay";

describe("protoAgentTestingOverlay", () => {
  afterEach(() => {
    uninstallAgentTestingOverlayApi();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("nests start/stop and force-clears", () => {
    // Node Vitest has no document — API still tracks active nest for MCP sessions.
    startAgentTestingOverlay("AGENT TESTING — unit");
    expect(isAgentTestingOverlayActive()).toBe(true);
    startAgentTestingOverlay("nested");
    stopAgentTestingOverlay();
    expect(isAgentTestingOverlayActive()).toBe(true);
    stopAgentTestingOverlay();
    expect(isAgentTestingOverlayActive()).toBe(false);

    startAgentTestingOverlay();
    startAgentTestingOverlay();
    stopAgentTestingOverlay({ force: true });
    expect(isAgentTestingOverlayActive()).toBe(false);
  });

  it("stop({ reload: true }) schedules a single reload after teardown", () => {
    const reload = vi.fn();
    const deferred: Array<() => void> = [];
    vi.stubGlobal("window", {
      setTimeout: (fn: TimerHandler, ms?: number) => {
        if (typeof fn === "function" && (ms ?? 0) < 1000) {
          deferred.push(fn as () => void);
        }
        return 0;
      },
      clearTimeout: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      location: { reload },
    });

    startAgentTestingOverlay("reload-test");
    stopAgentTestingOverlay({ reload: true });
    expect(isAgentTestingOverlayActive()).toBe(false);
    expect(deferred.length).toBe(1);
    deferred[0]();
    expect(reload).toHaveBeenCalledTimes(1);
  });

  it("manual stop defaults to no reload", () => {
    const reload = vi.fn();
    vi.stubGlobal("window", {
      setTimeout: () => 0,
      clearTimeout: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      location: { reload },
    });

    startAgentTestingOverlay();
    stopAgentTestingOverlay();
    expect(isAgentTestingOverlayActive()).toBe(false);
    expect(reload).not.toHaveBeenCalled();
  });
});
