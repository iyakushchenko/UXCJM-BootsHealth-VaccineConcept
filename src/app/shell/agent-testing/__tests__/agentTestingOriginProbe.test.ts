/**
 * @vitest-environment happy-dom
 */
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  formatOriginHostLabel,
  formatOriginSessionLine,
  peekOriginLiveStatus,
  probeStudioOrigin,
  resetOriginProbeForTests,
} from "@/app/shell/agent-testing/agentTestingOriginProbe";

describe("agentTestingOriginProbe", () => {
  afterEach(() => {
    resetOriginProbeForTests();
    vi.unstubAllGlobals();
  });

  it("formats Localhost:5173 from 127.0.0.1", () => {
    expect(
      formatOriginHostLabel({
        hostname: "127.0.0.1",
        port: "5173",
        protocol: "http:",
      })
    ).toBe("Localhost:5173");
    expect(
      formatOriginHostLabel({
        hostname: "localhost",
        port: "5173",
        protocol: "http:",
      })
    ).toBe("Localhost:5173");
  });

  it("builds host · status line", () => {
    expect(formatOriginSessionLine("active", "Localhost:5173")).toBe(
      "Localhost:5173 · Active"
    );
    expect(formatOriginSessionLine("offline", "Localhost:5173")).toBe(
      "Localhost:5173 · Offline"
    );
  });

  it("probe marks Active on ok fetch", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({ ok: true, status: 200 }))
    );
    // happy-dom location
    expect(await probeStudioOrigin()).toBe("active");
    expect(peekOriginLiveStatus()).toBe("active");
    expect(formatOriginSessionLine()).toMatch(/^.+ · Active$/);
  });

  it("probe marks Offline when fetch fails", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new Error("down");
      })
    );
    expect(await probeStudioOrigin()).toBe("offline");
    expect(peekOriginLiveStatus()).toBe("offline");
  });
});
