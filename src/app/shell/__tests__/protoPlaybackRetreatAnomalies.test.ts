import { describe, expect, it } from "vitest";
import {
  detectRetreatSelectionMismatch,
  detectRetreatSyncNoOp,
} from "@/app/shell/protoPlaybackRetreatAnomalies";
import type { JourneyBeat } from "@/app/orchestra/types";

const bookDateBeat: JourneyBeat = {
  id: "book-step2-date",
  label: "Book — date",
  kind: "tab-landing",
  protoTab: 6,
  bookScript: "select-book-date",
};

describe("protoPlaybackRetreatAnomalies", () => {
  it("detects selection mismatch when DOM still shows playback date after retreat", () => {
    const anomaly = detectRetreatSelectionMismatch({
      transportAction: "step-back",
      beatId: "book-step2-date",
      beatLabel: "Book — date",
      screenFramesBeat: false,
      isScripting: false,
      isPausingBeforeReveal: false,
      selectionGoal: {
        expectsSelection: true,
        domGoalMet: false,
        expected: "June 24 + 16:30",
        actual: "playback date June 21",
      },
      lastRetreatSync: {
        kind: "retreat-sync",
        label: "sync",
        beatId: "book-step2-date",
        scriptId: "select-book-date",
        atMs: performance.now(),
      },
    });

    expect(anomaly?.kind).toBe("retreat-selection-mismatch");
    expect(anomaly?.expected).toContain("June 24");
    expect(anomaly?.actual).toContain("June 21");
  });

  it("detects retreat sync no-op when beat expects sync but none recorded", () => {
    const anomaly = detectRetreatSyncNoOp(
      {
        transportAction: "step-back",
        beatId: "avail-continue",
        beatLabel: "Choose date",
        screenFramesBeat: false,
        isScripting: false,
        isPausingBeforeReveal: false,
        selectionGoal: {
          expectsSelection: true,
          domGoalMet: false,
          expected: "June 25",
          actual: "June 21",
        },
        lastRetreatSync: null,
      },
      {
        id: "avail-continue",
        label: "Choose date",
        kind: "overlay",
        availScript: "continue-from-date",
      }
    );

    expect(anomaly?.kind).toBe("retreat-sync-no-op");
    expect(anomaly?.message).toContain("retreat sync did not run");
  });

  it("passes when recent retreat sync matches beat", () => {
    expect(
      detectRetreatSyncNoOp(
        {
          transportAction: "step-back",
          beatId: bookDateBeat.id,
          screenFramesBeat: false,
          isScripting: false,
          isPausingBeforeReveal: false,
          selectionGoal: {
            expectsSelection: true,
            domGoalMet: true,
          },
          lastRetreatSync: {
            kind: "retreat-sync",
            label: "sync",
            beatId: bookDateBeat.id,
            scriptId: "select-book-date",
            atMs: performance.now(),
          },
        },
        bookDateBeat
      )
    ).toBeNull();
  });

  it("ignores non step-back transport", () => {
    expect(
      detectRetreatSelectionMismatch({
        transportAction: "step-forward",
        beatId: "book-step2-date",
        screenFramesBeat: false,
        isScripting: false,
        isPausingBeforeReveal: false,
        selectionGoal: {
          expectsSelection: true,
          domGoalMet: false,
        },
      })
    ).toBeNull();
  });
});
