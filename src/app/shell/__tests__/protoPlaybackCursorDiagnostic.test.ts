import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { resetControlPanelLogForTests } from "@/app/shell/protoControlPanelLog";
import { getQaHudState, resetQaHud } from "@/app/shell/protoControlPanelQa";
import {
  checkBookStep2DwellCursorViolations,
  enableCursorQaEyes,
  formatPlaybackCursorEventSummary,
  getPlaybackCursorSummary,
  getRecentPlaybackCursorEvents,
  isBookStep2BeatId,
  isBookStep2DwellBeatId,
  isCursorQaEyesEnabled,
  logCursorDiagnostic,
  notePlaybackCursorEvent,
  resetPlaybackCursorDiagnostic,
  resolveBookStep2CursorPhase,
  setPlaybackCursorDiagnosticContext,
  shouldTrackCursorDiagnostics,
} from "@/app/shell/protoPlaybackCursorDiagnostic";
import * as protoDemoCursor from "@/app/proto/protoDemoCursor";

describe("protoPlaybackCursorDiagnostic", () => {
  beforeEach(() => {
    resetPlaybackCursorDiagnostic();
    resetControlPanelLogForTests();
    resetQaHud();
    vi.stubGlobal("window", {
      __protoControlPanelLog: [],
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("identifies book step 2 beats", () => {
    expect(isBookStep2BeatId("book-step2")).toBe(true);
    expect(isBookStep2BeatId("book-step2-date")).toBe(true);
    expect(isBookStep2DwellBeatId("book-step2")).toBe(true);
    expect(isBookStep2DwellBeatId("book-step2-date")).toBe(false);
  });

  it("resolves book step 2 cursor phases", () => {
    expect(
      resolveBookStep2CursorPhase({ beatId: "book-step2", dwellOnly: true })
    ).toBe("dwell");
    expect(
      resolveBookStep2CursorPhase({
        beatId: "book-step2-date",
        syncState: true,
      })
    ).toBe("sync");
    expect(
      resolveBookStep2CursorPhase({ beatId: "book-step2-time" })
    ).toBe("script");
  });

  it("records cursor events and publishes QA HUD + control panel log", () => {
    enableCursorQaEyes();
    vi.spyOn(protoDemoCursor, "isDemoCursorJourneyModePinned").mockReturnValue(true);

    setPlaybackCursorDiagnosticContext({
      beatId: "book-step2",
      phase: "dwell",
    });

    const event = notePlaybackCursorEvent("travel", {
      target: '<button> text="Reserve"',
      animated: true,
    });

    expect(event.unexpectedOnDwell).toBe(true);
    expect(event.beatId).toBe("book-step2");
    expect(formatPlaybackCursorEventSummary(event)).toContain("travel");
    expect(getRecentPlaybackCursorEvents(1)[0]?.action).toBe("travel");
    expect(getPlaybackCursorSummary().unexpectedOnDwellCount).toBe(1);
    expect(getQaHudState().lastCursor).toContain("travel");
    expect(getQaHudState().cursorAction).toBe("travel");
    expect(getQaHudState().cursorBeatId).toBe("book-step2");
    const logActions = (window.__protoControlPanelLog ?? []).map((entry) => entry.action);
    expect(logActions).toContain("qa:cursor");
  });

  it("does not log qa:cursor when QA eyes off or journey mode unpinned", () => {
    setPlaybackCursorDiagnosticContext({
      beatId: "traditional-plp",
      scriptId: "plp-open-pdp",
    });

    notePlaybackCursorEvent("remove", { detail: "immediate" });
    expect(window.__protoControlPanelLog ?? []).toHaveLength(0);

    enableCursorQaEyes();
    vi.spyOn(protoDemoCursor, "isDemoCursorJourneyModePinned").mockReturnValue(
      false
    );
    expect(shouldTrackCursorDiagnostics()).toBe(false);

    notePlaybackCursorEvent("remove", { detail: "immediate" });
    expect(window.__protoControlPanelLog ?? []).toHaveLength(0);
    expect(getRecentPlaybackCursorEvents(1)).toHaveLength(0);
  });

  it("attaches beat/script context from playback diagnostic context", () => {
    enableCursorQaEyes();
    vi.spyOn(protoDemoCursor, "isDemoCursorJourneyModePinned").mockReturnValue(true);

    setPlaybackCursorDiagnosticContext({
      beatId: "book-step2-date",
      scriptId: "select-book-date",
      phase: "script",
    });

    const event = logCursorDiagnostic("click", {
      target: '<button> text="24"',
    });

    expect(event.beatId).toBe("book-step2-date");
    expect(event.scriptId).toBe("select-book-date");
    expect(event.phase).toBe("script");
    expect(event.unexpectedOnDwell).toBeUndefined();
  });

  it("keeps a ring buffer of the last 20 events", () => {
    enableCursorQaEyes();
    vi.spyOn(protoDemoCursor, "isDemoCursorJourneyModePinned").mockReturnValue(true);

    for (let i = 0; i < 25; i++) {
      notePlaybackCursorEvent("park", { detail: `tick-${i}` });
    }
    expect(getRecentPlaybackCursorEvents(25)).toHaveLength(20);
    expect(getRecentPlaybackCursorEvents(1)[0]?.detail).toBe("tick-24");
  });

  it("does not flag park or dwell-no-cursor on dwell beat as unexpected", () => {
    enableCursorQaEyes();
    vi.spyOn(protoDemoCursor, "isDemoCursorJourneyModePinned").mockReturnValue(true);

    setPlaybackCursorDiagnosticContext({ beatId: "book-step2", phase: "dwell" });
    const park = notePlaybackCursorEvent("park", { animated: true });
    const dwell = notePlaybackCursorEvent("dwell-no-cursor", { detail: "enter" });
    const scroll = notePlaybackCursorEvent("scroll-into-view", {
      detail: "retreat sync",
      scroll: true,
    });

    expect(park.unexpectedOnDwell).toBeUndefined();
    expect(dwell.unexpectedOnDwell).toBeUndefined();
    expect(scroll.unexpectedOnDwell).toBeUndefined();
    expect(getPlaybackCursorSummary().unexpectedOnDwellCount).toBe(0);
  });

  it("flags travel on book-step2 dwell and supports robot QA violation checks", () => {
    enableCursorQaEyes();
    vi.spyOn(protoDemoCursor, "isDemoCursorJourneyModePinned").mockReturnValue(true);
    expect(isCursorQaEyesEnabled()).toBe(true);

    setPlaybackCursorDiagnosticContext({ beatId: "book-step2", phase: "dwell" });
    const marker = getPlaybackCursorSummary().last?.seq ?? 0;
    notePlaybackCursorEvent("dwell-no-cursor", { detail: "enter" });
    notePlaybackCursorEvent("travel", { target: '<button> text="Reserve"' });

    const check = checkBookStep2DwellCursorViolations(marker);
    expect(check.pass).toBe(false);
    expect(check.violations[0]?.action).toBe("travel");
  });
});
