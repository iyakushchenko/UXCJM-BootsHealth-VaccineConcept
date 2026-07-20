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

  it("formats lean label", () => {
    expect(
      formatDiagMirrorLabel(
        ev({ kind: "scroll", beatId: "b1", detail: "into-view" })
      )
    ).toContain("scroll");
  });

  it("getDiagMirrorRows returns array", () => {
    expect(Array.isArray(getDiagMirrorRows(4))).toBe(true);
  });
});
