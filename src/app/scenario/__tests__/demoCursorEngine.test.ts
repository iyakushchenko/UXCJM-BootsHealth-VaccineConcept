/** @vitest-environment happy-dom */
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  cancelDemoCursorTravel,
  parkDemoCursorAtRest,
  removeDemoCursor,
  setDemoCursorJourneyMode,
} from "@/app/scenario/demoCursor";
import {
  resolveCursorParkDecision,
  resetCursorEngineTrackerForTests,
} from "@/app/scenario/demoCursorEngine";
import { playbackDiagClear, getPlaybackDiagBundle } from "@/app/shell/playbackDiag";
import {
  shouldMirrorPlaybackDiagToQa,
  labelForPlaybackDiagEvent,
  outcomeForPlaybackDiagEvent,
} from "@/app/shell/playbackDiagQaBridge";

describe("demoCursorEngine park policy", () => {
  afterEach(() => {
    cancelDemoCursorTravel();
    setDemoCursorJourneyMode(false);
    removeDemoCursor({ immediate: true });
    resetCursorEngineTrackerForTests();
    playbackDiagClear();
    vi.restoreAllMocks();
  });

  it("defaults to travel when a start pose exists", () => {
    const d = resolveCursorParkDecision({
      hasStartPos: true,
      reason: "retreat",
    });
    expect(d.animate).toBe(true);
    expect(d.abruptAttempt).toBe(false);
    expect(d.mode).toBe("travel");
  });

  it("force snaps without abrupt flag", () => {
    const d = resolveCursorParkDecision({
      hasStartPos: true,
      force: true,
      reason: "resize",
    });
    expect(d.animate).toBe(false);
    expect(d.abruptAttempt).toBe(false);
    expect(d.mode).toBe("force");
  });

  it("first-mount seeds when no start pose", () => {
    const d = resolveCursorParkDecision({
      hasStartPos: false,
      reason: "journey-mode-on",
    });
    expect(d.animate).toBe(false);
    expect(d.mode).toBe("first-mount");
    expect(d.abruptAttempt).toBe(false);
  });

  it("animate:false without force is abrupt → coerce travel", () => {
    const d = resolveCursorParkDecision({
      hasStartPos: true,
      animate: false,
      reason: "legacy-snap",
    });
    expect(d.animate).toBe(true);
    expect(d.abruptAttempt).toBe(true);
    expect(d.mode).toBe("abrupt-coerced");
  });

  it("parkDemoCursorAtRest coerces legacy animate:false and logs ABRUPT-PARK", async () => {
    vi.spyOn(console, "info").mockImplementation(() => {});
    setDemoCursorJourneyMode(true, { parkAfterInteraction: true });
    await new Promise((r) => setTimeout(r, 0));
    const cursor = document.querySelector<HTMLElement>(".proto-chat-demo-cursor");
    expect(cursor).not.toBeNull();
    // Leave parked rest so next park has a start pose away from new rest.
    cursor!.classList.remove("proto-chat-demo-cursor--parked");
    cursor!.style.left = "120px";
    cursor!.style.top = "80px";

    await parkDemoCursorAtRest({ animate: false, reason: "legacy-caller" });

    const events = getPlaybackDiagBundle().events;
    const abrupt = events.filter((e) =>
      /ABRUPT-PARK/i.test(String(e.detail ?? ""))
    );
    expect(abrupt.length).toBeGreaterThan(0);
    expect(shouldMirrorPlaybackDiagToQa(abrupt[0]!)).toBe(true);
    expect(labelForPlaybackDiagEvent(abrupt[0]!)).toMatch(/teleported/i);
    expect(outcomeForPlaybackDiagEvent(abrupt[0]!)).toBe("fail");
  });
});
