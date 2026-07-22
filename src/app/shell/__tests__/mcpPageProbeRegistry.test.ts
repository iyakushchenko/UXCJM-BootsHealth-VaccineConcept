import { describe, expect, it } from "vitest";
import {
  listRegisteredMcpPageProbeScreens,
  registerMcpPageProbeSteps,
  resolveMcpPageProbeSteps,
} from "@/app/shell/mcpPageProbeRegistry";
import { registerBootsMcpPageProbes } from "@/projects/boots-pharmacy/screens/registerMcpPageProbes";

describe("mcpPageProbeRegistry", () => {
  it("resolves project-registered screen recipes", () => {
    registerBootsMcpPageProbes();
    expect(listRegisteredMcpPageProbeScreens()).toEqual(
      expect.arrayContaining([
        "appointment-details",
        "appointment-history",
        "chat",
        "site-pilot",
      ])
    );
    expect(resolveMcpPageProbeSteps("appointment-history")?.[0]?.id).toBeTruthy();
    expect(resolveMcpPageProbeSteps("no-such-screen")).toBeNull();
  });

  it("allows overwrite registration for a screenId", () => {
    registerMcpPageProbeSteps("zz-registry-unit", () => [
      {
        id: "unit-host",
        selector: "[data-studio-react-screen=zz-registry-unit]",
        action: "assert",
      },
    ]);
    expect(resolveMcpPageProbeSteps("zz-registry-unit")?.[0]?.id).toBe(
      "unit-host"
    );
  });

  it("rejects empty screenId", () => {
    expect(() =>
      registerMcpPageProbeSteps("  ", () => [
        { id: "x", selector: "body", action: "assert" },
      ])
    ).toThrow(/screenId required/);
  });
});
