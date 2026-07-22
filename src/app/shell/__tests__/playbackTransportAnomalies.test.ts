/** @vitest-environment happy-dom */
import { afterEach, describe, expect, it } from "vitest";
import {
  detectDirectorScriptOffAir,
  detectPlaylistFrameSkip,
  detectStrayPopupOnBeat,
  detectTouchpointAheadOfBeat,
} from "@/app/shell/playbackTransportAnomalies";

describe("detectPlaylistFrameSkip", () => {
  it("flags when one step jumps over a playlist frame", () => {
    const anomaly = detectPlaylistFrameSkip({
      prevTouchpointIndex: 2,
      nextTouchpointIndex: 4,
      beatId: "choose-location",
      nextTouchpointKey: "popup:availability:list",
    });
    expect(anomaly?.kind).toBe("playlist-frame-skip");
    expect(anomaly?.message).toContain("skipped 1 frame");
  });

  it("allows single-frame advances", () => {
    expect(
      detectPlaylistFrameSkip({
        prevTouchpointIndex: 2,
        nextTouchpointIndex: 3,
        nextTouchpointKey: "beat:choose-location",
      })
    ).toBeNull();
  });

  it("allows confirmation chain landing on appointment details", () => {
    expect(
      detectPlaylistFrameSkip({
        prevTouchpointIndex: 21,
        nextTouchpointIndex: 23,
        prevTouchpointKey: "beat:confirmation",
        nextTouchpointKey: "beat:appointment-details",
      })
    ).toBeNull();
  });

  it("allows chat finale handoff to Availability date", () => {
    expect(
      detectPlaylistFrameSkip({
        prevTouchpointIndex: 12,
        nextTouchpointIndex: 15,
        prevTouchpointKey: "beat:agentic-chat:frame:8",
        nextTouchpointKey: "popup:availability:date",
      })
    ).toBeNull();
  });
});

describe("detectTouchpointAheadOfBeat", () => {
  it("allows availability popup sub-steps on choose-location beat", () => {
    expect(
      detectTouchpointAheadOfBeat({
        beatPlaylistIndex: 3,
        touchpointPlaylistIndex: 4,
        beatId: "choose-location",
        touchpointKey: "popup:availability:list",
      })
    ).toBeNull();
  });

  it("allows the immediate next playlist frame before beat advances (PDP → login popup)", () => {
    expect(
      detectTouchpointAheadOfBeat({
        beatPlaylistIndex: 1,
        touchpointPlaylistIndex: 2,
        beatId: "traditional-pdp",
        touchpointKey: "popup:login",
      })
    ).toBeNull();
  });

  it("allows chat scenario frame substeps on agentic-chat beat", () => {
    expect(
      detectTouchpointAheadOfBeat({
        beatPlaylistIndex: 1,
        touchpointPlaylistIndex: 3,
        beatId: "agentic-chat",
        touchpointKey: "beat:agentic-chat:frame:2",
      })
    ).toBeNull();
    expect(
      detectTouchpointAheadOfBeat({
        beatPlaylistIndex: 1,
        touchpointPlaylistIndex: 2,
        beatId: "agentic-chat",
        touchpointKey: "beat:agentic-chat:frame:2:thinking",
      })
    ).toBeNull();
  });

  it("allows login popup while beat is still on traditional-plp (PDP script lag)", () => {
    expect(
      detectTouchpointAheadOfBeat({
        beatPlaylistIndex: 0,
        touchpointPlaylistIndex: 2,
        beatId: "traditional-plp",
        touchpointKey: "popup:login",
      })
    ).toBeNull();
  });

  it("allows chat finale Availability date while beat still agentic-chat", () => {
    expect(
      detectTouchpointAheadOfBeat({
        beatPlaylistIndex: 1,
        touchpointPlaylistIndex: 15,
        beatId: "agentic-chat",
        touchpointKey: "popup:availability:date",
      })
    ).toBeNull();
  });

  it("flags touchpoint ahead of beat when gap is two or more frames", () => {
    const anomaly = detectTouchpointAheadOfBeat({
      beatPlaylistIndex: 3,
      touchpointPlaylistIndex: 5,
      beatId: "choose-location",
      touchpointKey: "beat:book-step2",
    });
    expect(anomaly?.kind).toBe("touchpoint-ahead-of-beat");
  });
});

describe("detectDirectorScriptOffAir", () => {
  it("flags scripting without on-air", () => {
    const anomaly = detectDirectorScriptOffAir({
      isScripting: true,
      isOnAir: false,
      beatId: "book-step2-time",
      scriptLabel: "select-book-time",
    });
    expect(anomaly?.kind).toBe("director-script-off-air");
  });

  it("passes when scripting and on-air agree", () => {
    expect(
      detectDirectorScriptOffAir({
        isScripting: true,
        isOnAir: true,
        beatId: "book-step2-time",
        scriptLabel: "select-book-time",
      })
    ).toBeNull();
  });
});

describe("detectStrayPopupOnBeat", () => {
  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("flags a live popup after a non-overlay destination settles", () => {
    document.body.innerHTML = `<div class="studio-avail-scrim"></div>`;
    const anomaly = detectStrayPopupOnBeat({
      beatId: "book-step2",
      beatKind: "tab-landing",
      screenSettled: true,
      availabilityOpen: true,
    });
    expect(anomaly?.kind).toBe("stray-popup-on-beat");
    expect(anomaly?.message).toContain("availability");
  });

  it("ignores stale availabilityOpen without a live scrim", () => {
    expect(
      detectStrayPopupOnBeat({
        beatId: "book-step2",
        beatKind: "tab-landing",
        screenSettled: true,
        availabilityOpen: true,
      })
    ).toBeNull();
  });

  it("passes when book-step2 has no popups open", () => {
    expect(
      detectStrayPopupOnBeat({
        beatId: "book-step2",
        beatKind: "tab-landing",
        screenSettled: true,
        availabilityOpen: false,
        loginPopupOpen: false,
      })
    ).toBeNull();
  });

  it("ignores popup-owning overlay beats", () => {
    document.body.innerHTML = `<div class="studio-avail-scrim"></div>`;
    expect(
      detectStrayPopupOnBeat({
        beatId: "choose-location",
        beatKind: "overlay",
        screenSettled: true,
        availabilityOpen: true,
      })
    ).toBeNull();
  });

  it("ignores a visual bridge until the destination settles", () => {
    document.body.innerHTML = `<div class="studio-avail-scrim"></div>`;
    expect(
      detectStrayPopupOnBeat({
        beatId: "any-destination",
        beatKind: "tab-landing",
        screenSettled: false,
        availabilityOpen: true,
      })
    ).toBeNull();
  });

  it("ignores popups owned by a screen-frame scenario", () => {
    document.body.innerHTML = `<div class="studio-avail-scrim"></div>`;
    expect(
      detectStrayPopupOnBeat({
        beatId: "interactive-chat",
        beatKind: "screen-frames",
        screenSettled: true,
        availabilityOpen: true,
      })
    ).toBeNull();
  });

  it("ignores a popup owned by a scripted tab interaction", () => {
    document.body.innerHTML = `<div class="studio-avail-scrim"></div>`;
    expect(
      detectStrayPopupOnBeat({
        beatId: "sign-in",
        beatKind: "tab-landing",
        beatOwnsInteraction: true,
        screenSettled: true,
        availabilityOpen: true,
      })
    ).toBeNull();
  });

  it("ignores a settled beat while its director script is still running", () => {
    document.body.innerHTML = `<div class="studio-avail-scrim"></div>`;
    expect(
      detectStrayPopupOnBeat({
        beatId: "book-step2",
        beatKind: "tab-landing",
        screenSettled: true,
        isScripting: true,
        availabilityOpen: true,
      })
    ).toBeNull();
  });
});
