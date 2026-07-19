/** @vitest-environment happy-dom */
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@/app/scenario/demoCursor", () => ({
  cancelDemoCursorTravel: vi.fn(),
}));

vi.mock("@/app/scenario/playbackScroll", () => ({
  cancelPlaybackScroll: vi.fn(),
}));

import { cancelDemoCursorTravel } from "@/app/scenario/demoCursor";
import { cancelPlaybackScroll } from "@/app/scenario/playbackScroll";
import {
  acknowledgePlaybackDiagnosticStop,
  haltPlaybackForPoSignal,
  registerPoSignalPlaybackHalt,
} from "@/app/shell/agent-testing/agentTestingPlaybackHalt";
import {
  clearPoSignal,
  peekPoSignal,
} from "@/app/shell/agent-testing/agentTestingPoSignal";

describe("agentTestingPlaybackHalt", () => {
  afterEach(() => {
    registerPoSignalPlaybackHalt(null);
    clearPoSignal();
    vi.clearAllMocks();
  });

  it("haltPlaybackForPoSignal calls registered halt + cursor/scroll cancel sync", () => {
    const halt = vi.fn();
    registerPoSignalPlaybackHalt(halt);
    haltPlaybackForPoSignal("po-alarm");
    expect(halt).toHaveBeenCalledTimes(1);
    expect(cancelDemoCursorTravel).toHaveBeenCalled();
    expect(cancelPlaybackScroll).toHaveBeenCalled();
  });

  it("acknowledgePlaybackDiagnosticStop halts and latches DIAGNOSTIC_ACK_STOP", () => {
    const halt = vi.fn();
    registerPoSignalPlaybackHalt(halt);
    acknowledgePlaybackDiagnosticStop("overlay-cancel");
    expect(halt).toHaveBeenCalledTimes(1);
    expect(peekPoSignal()?.code).toBe("DIAGNOSTIC_ACK_STOP");
    expect(peekPoSignal()?.type).toBe("alarm");
  });
});
