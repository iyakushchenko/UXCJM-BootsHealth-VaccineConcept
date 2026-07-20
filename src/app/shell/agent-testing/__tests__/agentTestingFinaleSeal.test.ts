/**
 * @vitest-environment happy-dom
 */
import { describe, expect, it, beforeEach } from "vitest";
import {
  clearAgentTestingFinaleSeal,
  isAgentTestingFinaleSealed,
  isQuietDiagDismissSource,
  sealAgentTestingFinale,
} from "@/app/shell/agent-testing/agentTestingFinaleSeal";

describe("agentTestingFinaleSeal", () => {
  beforeEach(() => {
    clearAgentTestingFinaleSeal();
  });

  it("seals and clears", () => {
    expect(isAgentTestingFinaleSealed()).toBe(false);
    sealAgentTestingFinale();
    expect(isAgentTestingFinaleSealed()).toBe(true);
    clearAgentTestingFinaleSeal();
    expect(isAgentTestingFinaleSealed()).toBe(false);
  });

  it("quiet dismiss sources for finale / prove wipe", () => {
    expect(isQuietDiagDismissSource("session-finale")).toBe(true);
    expect(isQuietDiagDismissSource("prove-wave-end")).toBe(true);
    expect(isQuietDiagDismissSource("force-clear")).toBe(true);
    expect(isQuietDiagDismissSource("qa-ack")).toBe(false);
  });
});
