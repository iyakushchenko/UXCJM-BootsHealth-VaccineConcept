import { describe, expect, it, beforeEach } from "vitest";
import {
  escalateObserveToAgent,
  getSessionKind,
  resetQaSessionForTests,
  resolveHandoffKind,
  setSessionKind,
  shouldWipeOnHandoff,
  unlockAgentToObserve,
} from "@/app/shell/agent-testing/agentTestingSession";

describe("agentTestingSession", () => {
  beforeEach(() => {
    resetQaSessionForTests();
  });

  it("escalates observe → agent and unlocks back", () => {
    setSessionKind("observe");
    expect(escalateObserveToAgent()).toBe(true);
    expect(getSessionKind()).toBe("agent");
    expect(unlockAgentToObserve()).toBe(true);
    expect(getSessionKind()).toBe("observe");
  });

  it("handoff wipe vs oversee", () => {
    expect(shouldWipeOnHandoff({})).toBe(true);
    expect(shouldWipeOnHandoff({ oversee: false })).toBe(true);
    expect(shouldWipeOnHandoff({ oversee: true })).toBe(false);
    expect(resolveHandoffKind({ oversee: true, kind: "observe" })).toBe(
      "observe"
    );
    expect(resolveHandoffKind({ oversee: true })).toBe("agent");
  });
});
