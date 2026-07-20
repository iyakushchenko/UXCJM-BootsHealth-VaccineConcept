/**
 * @vitest-environment happy-dom
 */
import { describe, expect, it } from "vitest";
import {
  formatDiagMirrorLabel,
  getDiagMirrorRows,
  severityForDiagEvent,
} from "@/app/shell/agent-testing/agentTestingDiagMirror";
import type { PlaybackDiagEvent } from "@/app/shell/playbackDiag";

function ev(partial: Partial<PlaybackDiagEvent>): PlaybackDiagEvent {
  return {
    t: Date.now(),
    kind: "info",
    ...partial,
  } as PlaybackDiagEvent;
}

describe("agentTestingDiagMirror", () => {
  it("severity: fail on clickOk false", () => {
    expect(severityForDiagEvent(ev({ kind: "click", clickOk: false }))).toBe(
      "fail"
    );
  });

  it("formats human label (same as QA chat)", () => {
    expect(
      formatDiagMirrorLabel(
        ev({
          kind: "scroll",
          detail: "camera",
          scroll: { beforeTop: 400, afterTop: 200, retreat: false },
        })
      )
    ).toMatch(/wrong way/i);
  });

  it("getDiagMirrorRows returns array", () => {
    expect(Array.isArray(getDiagMirrorRows(4))).toBe(true);
  });
});
