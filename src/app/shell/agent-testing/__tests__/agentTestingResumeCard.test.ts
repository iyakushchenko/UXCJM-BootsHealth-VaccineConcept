/** @vitest-environment happy-dom */
import { describe, expect, it } from "vitest";
import {
  buildQaAgentResumeCard,
  isQaAgentOfflineForMessage,
} from "@/app/shell/agent-testing/agentTestingResumeCard";
import { clearQaAgentPresence } from "@/app/shell/agent-testing/agentTestingPresence";

describe("agentTestingResumeCard", () => {
  it("reports offline when presence cleared", () => {
    clearQaAgentPresence();
    expect(isQaAgentOfflineForMessage()).toBe(true);
    const card = buildQaAgentResumeCard("fix the scroll pause");
    expect(card.offline).toBe(true);
    expect(card.markdown).toContain("fix the scroll pause");
    expect(card.markdown).toContain("__studioConsumePoSignal");
    expect(card.markdown).toContain("pauseForAgentLeave");
    expect(card.markdown).toContain("resumeForAgentReturn");
    expect(card.markdown).toContain("__studioOpenQaLogger");
    expect(card.markdown).toContain("127.0.0.1:5173");
  });
});
