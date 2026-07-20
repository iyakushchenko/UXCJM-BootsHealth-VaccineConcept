/**
 * @vitest-environment happy-dom
 */
import { describe, expect, it } from "vitest";
import {
  deriveAgentControlKind,
  formatAgentControlKindSuffix,
  isCjmCassetteOn,
} from "@/app/shell/agent-testing/agentTestingControlKind";

describe("agentTestingControlKind", () => {
  it("null when not agent session", () => {
    expect(
      deriveAgentControlKind({ sessionKind: "manual", cjmOn: true })
    ).toBeNull();
    expect(
      deriveAgentControlKind({ sessionKind: "observe", cjmOn: false })
    ).toBeNull();
  });

  it("playback when agent + CJM on; manual when agent + CJM off", () => {
    expect(
      deriveAgentControlKind({ sessionKind: "agent", cjmOn: true })
    ).toBe("playback");
    expect(
      deriveAgentControlKind({ sessionKind: "agent", cjmOn: false })
    ).toBe("manual");
  });

  it("suffix + cjm cassette helper", () => {
    expect(formatAgentControlKindSuffix("playback")).toBe(" · PLAYBACK");
    expect(formatAgentControlKindSuffix("manual")).toBe(" · MANUAL");
    expect(formatAgentControlKindSuffix(null)).toBe("");
    expect(isCjmCassetteOn("on")).toBe(true);
    expect(isCjmCassetteOn("agentic-cjm")).toBe(true);
    expect(isCjmCassetteOn("off")).toBe(false);
    expect(isCjmCassetteOn("hub")).toBe(false);
  });
});
