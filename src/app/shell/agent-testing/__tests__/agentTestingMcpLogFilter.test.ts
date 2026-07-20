import { describe, expect, it } from "vitest";
import { shouldLogMcpPhaseToChat } from "@/app/shell/agent-testing/agentTestingQaListenBridge";

describe("shouldLogMcpPhaseToChat", () => {
  it("suppresses CONNECTING/CONNECTED flash spam", () => {
    expect(shouldLogMcpPhaseToChat("", "connecting")).toBe(false);
    expect(shouldLogMcpPhaseToChat("connecting", "connected")).toBe(false);
    expect(shouldLogMcpPhaseToChat("connected", "control")).toBe(false);
    expect(shouldLogMcpPhaseToChat("—", "observe")).toBe(false);
  });

  it("logs PENDING start, ERROR, and CONTROL↔OBSERVE", () => {
    expect(shouldLogMcpPhaseToChat("control", "pending")).toBe(true);
    expect(shouldLogMcpPhaseToChat("control", "error")).toBe(true);
    expect(shouldLogMcpPhaseToChat("error", "control")).toBe(true);
    expect(shouldLogMcpPhaseToChat("control", "observe")).toBe(true);
    expect(shouldLogMcpPhaseToChat("observe", "control")).toBe(true);
  });

  it("skips PENDING leave (Reply/timeout already logged)", () => {
    expect(shouldLogMcpPhaseToChat("pending", "control")).toBe(false);
  });
});
