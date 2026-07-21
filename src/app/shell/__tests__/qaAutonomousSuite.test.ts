/** @vitest-environment happy-dom */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { QA_SUITE_COLLECTION, installAutonomousQaSuiteApi } from "@/app/shell/qaAutonomousSuite";

const settle = () => new Promise((resolve) => setTimeout(resolve, 0));

describe("autonomous QA suite", () => {
  beforeEach(() => {
    sessionStorage.clear();
    window.__studioAgentTestingOverlay = {
      touch: vi.fn(), logStep: vi.fn(), ringAlarm: vi.fn(), appendFinale: vi.fn(),
      ackDiagnostic: vi.fn(), consumePoSignal: vi.fn(),
    } as unknown as typeof window.__studioAgentTestingOverlay;
    installAutonomousQaSuiteApi();
    expect(window.__studioRunQaSuiteById).toBeTypeOf("function");
    expect(window.__studioRunGlobalCompatibilityTests).toBeTypeOf("function");
  });

  it("runs a declarative queue without agent polling", async () => {
    window.__studioRunMcpSanityCheck = vi.fn(async () => ({ pass: true }));
    window.__studioRunQaSelfTestSmoke = vi.fn(async () => ({ ok: true }));
    window.__studioStartQaSuite?.(["mcp-sanity", "qa-self-test"], { suiteId: "lean" });
    await settle();
    expect(window.__studioGetQaSuiteStatus?.()).toMatchObject({ phase: "passed", index: 2, total: 2 });
  });

  it("stops on failure and proceed reruns the failed test", async () => {
    let pass = false;
    window.__studioRunMcpSanityCheck = vi.fn(async () => ({ pass }));
    window.__studioStartQaSuite?.(["mcp-sanity"]);
    await settle();
    expect(window.__studioGetQaSuiteStatus?.().phase).toBe("paused-failure");
    pass = true;
    window.__studioProceedQaSuite?.();
    await settle();
    expect(window.__studioGetQaSuiteStatus?.().phase).toBe("passed");
    expect(window.__studioRunMcpSanityCheck).toHaveBeenCalledTimes(2);
  });

  it("keeps the visible collection project-agnostic", () => {
    expect(QA_SUITE_COLLECTION.map((suite) => suite.label)).toEqual([
      "QA tool health",
      "Test current page",
      "Map current page interactions",
      "Map all project interactions",
      "Test current CJM",
      "Test all CJMs",
      "Current project core",
    ]);
  });

  it("enumerates all current-project CJMs and stops on the first failure", async () => {
    window.__protoListJourneys = () => [
      { id: "one", label: "One", beatCount: 1, beatIds: ["one"] },
      { id: "two", label: "Two", beatCount: 1, beatIds: ["two"] },
      { id: "three", label: "Three", beatCount: 1, beatIds: ["three"] },
    ];
    window.__studioRunFullPlayProve = vi.fn(async ({ journeyId }) => ({ pass: journeyId !== "two" }));
    window.__studioStartQaSuite?.(["play-all-cjms"]);
    await settle();
    expect(window.__studioGetQaSuiteStatus?.().phase).toBe("paused-failure");
    expect(window.__studioRunFullPlayProve).toHaveBeenCalledTimes(2);
  });
});
