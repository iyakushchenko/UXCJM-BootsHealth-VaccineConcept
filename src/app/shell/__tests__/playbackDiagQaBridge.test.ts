import { describe, expect, it, beforeEach, afterEach } from "vitest";
import {
  labelForPlaybackDiagEvent,
  mirrorPlaybackDiagClearToQa,
  outcomeForPlaybackDiagEvent,
  shouldMirrorPlaybackDiagToQa,
} from "@/app/shell/playbackDiagQaBridge";
import type { PlaybackDiagEvent } from "@/app/shell/playbackDiag";
import {
  closeQaDiagGate,
  getQaDiagRing,
  openQaDiagGate,
  replaceQaDiagRing,
} from "@/app/shell/qaDiagGate";

function ev(partial: Partial<PlaybackDiagEvent> & { kind: PlaybackDiagEvent["kind"] }): PlaybackDiagEvent {
  return { t: 1, ...partial };
}

describe("playbackDiagQaBridge", () => {
  beforeEach(() => {
    openQaDiagGate({ logger: true, reason: "test" });
    replaceQaDiagRing([]);
  });
  afterEach(() => {
    closeQaDiagGate({ reason: "test" });
    replaceQaDiagRing([]);
  });

  it("mirrors type-in start/end; never type-in-progress", () => {
    expect(
      shouldMirrorPlaybackDiagToQa(ev({ kind: "type-in-start", detail: "start" }))
    ).toBe(true);
    expect(
      shouldMirrorPlaybackDiagToQa(ev({ kind: "type-in-end", typeOk: true }))
    ).toBe(true);
    expect(
      shouldMirrorPlaybackDiagToQa(
        ev({ kind: "type-in-progress", chars: 12, targetChars: 40 })
      )
    ).toBe(false);
  });

  it("mirrors click FAIL and clear; skips healthy step-forward", () => {
    expect(
      shouldMirrorPlaybackDiagToQa(
        ev({ kind: "click", clickOk: false, detail: "click FAIL" })
      )
    ).toBe(true);
    expect(
      shouldMirrorPlaybackDiagToQa(
        ev({ kind: "step-forward", detail: "Studio nav — Step forward" })
      )
    ).toBe(false);
    expect(
      outcomeForPlaybackDiagEvent(
        ev({ kind: "click", clickOk: false, detail: "click FAIL" })
      )
    ).toBe("fail");
    expect(labelForPlaybackDiagEvent(ev({ kind: "click", clickOk: false }))).toMatch(
      /Click missed/
    );
  });

  it("flags unexpected scroll-reversal as soft-fail with human label", () => {
    const scroll = ev({
      kind: "scroll",
      detail: "scrollCameraToOrigin — host top (named SSoT)",
      scroll: { beforeTop: 400, afterTop: 200, retreat: false },
    });
    expect(shouldMirrorPlaybackDiagToQa(scroll)).toBe(true);
    expect(outcomeForPlaybackDiagEvent(scroll)).toBe("soft-fail");
    expect(labelForPlaybackDiagEvent(scroll)).toMatch(/wrong way/i);
  });

  it("does not soft-fail target-driven scrollIntoView (large upward camera is OK)", () => {
    const scroll = ev({
      kind: "scroll",
      detail: "scrollIntoView done (eased)",
      scroll: {
        beforeTop: 1475,
        afterTop: 0,
        retreat: false,
        intoViewRequested: true,
        intoViewDone: true,
      },
    });
    expect(shouldMirrorPlaybackDiagToQa(scroll)).toBe(false);
  });

  it("mirrors bubble CHOP/JUMP; suppresses TRACE frames", () => {
    expect(
      shouldMirrorPlaybackDiagToQa(
        ev({
          kind: "chat-bubble-motion",
          detail: "CHOP",
          bubble: { chop: true, jump: false, phase: "frame" },
        })
      )
    ).toBe(true);
    expect(
      labelForPlaybackDiagEvent(
        ev({
          kind: "chat-bubble-motion",
          detail: "CHOP",
          bubble: { chop: true },
        })
      )
    ).toMatch(/cut short/i);
    expect(
      shouldMirrorPlaybackDiagToQa(
        ev({
          kind: "chat-bubble-motion",
          detail: "trace",
          bubble: { phase: "trace", chop: false, jump: false },
        })
      )
    ).toBe(false);
  });

  it("humanizes cursor remove / type-in-park (even when not mirrored)", () => {
    expect(
      labelForPlaybackDiagEvent(ev({ kind: "cursor", detail: "remove" }))
    ).toBe("Cursor cleared");
    expect(
      labelForPlaybackDiagEvent(
        ev({ kind: "cursor", detail: "PARKED — type-in-park (park)" })
      )
    ).toBe("Cursor parked for typing");
    expect(
      shouldMirrorPlaybackDiagToQa(ev({ kind: "cursor", detail: "remove" }))
    ).toBe(false);
  });

  it("ignores small upward camera nudge", () => {
    const nudge = ev({
      kind: "scroll",
      detail: "camera",
      scroll: { beforeTop: 400, afterTop: 380, retreat: false },
    });
    expect(shouldMirrorPlaybackDiagToQa(nudge)).toBe(false);
  });

  it("journey-reset / play-end / typing started stay neutral ok", () => {
    expect(
      outcomeForPlaybackDiagEvent(ev({ kind: "journey-reset", detail: "reset" }))
    ).toBe("ok");
    expect(
      outcomeForPlaybackDiagEvent(ev({ kind: "play-end", detail: "end" }))
    ).toBe("ok");
    expect(
      outcomeForPlaybackDiagEvent(ev({ kind: "type-in-start", detail: "start" }))
    ).toBe("ok");
    expect(labelForPlaybackDiagEvent(ev({ kind: "journey-reset" }))).toBe(
      "Journey reset to start"
    );
  });

  it("clear appends playback-diag ring row as neutral ok", () => {
    mirrorPlaybackDiagClearToQa();
    const ring = getQaDiagRing();
    expect(
      ring.some(
        (e) => e.kind === "playback-diag" && /cleared/i.test(e.label || "")
      )
    ).toBe(true);
  });
});
