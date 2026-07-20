import { afterEach, describe, expect, it, vi } from "vitest";
import {
  appendQaDiagRing,
  closeQaDiagGate,
  getQaDiagRing,
  hydrateQaDiagGate,
  isQaDiagGateOpen,
  openQaDiagGate,
  resetQaDiagGateForTests,
} from "@/app/shell/qaDiagGate";
import { playbackDiagLog, playbackDiagClear } from "@/app/shell/playbackDiag";

describe("qaDiagGate", () => {
  afterEach(() => {
    resetQaDiagGateForTests();
    vi.restoreAllMocks();
  });

  it("opens and closes gate with persist hydrate", () => {
    expect(isQaDiagGateOpen()).toBe(false);
    openQaDiagGate({ reason: "test" });
    expect(isQaDiagGateOpen()).toBe(true);
    appendQaDiagRing({ kind: "po-note", text: "hello" });
    expect(getQaDiagRing().some((e) => e.kind === "po-note")).toBe(true);
    closeQaDiagGate();
    expect(isQaDiagGateOpen()).toBe(false);
    const again = hydrateQaDiagGate();
    expect(again.open).toBe(false);
    expect(again.ring.length).toBeGreaterThan(0);
  });

  it("PLAYBACK_DIAG console is quiet when gate closed", () => {
    const info = vi.spyOn(console, "info").mockImplementation(() => {});
    playbackDiagClear();
    playbackDiagLog("info", "silent-when-closed");
    expect(
      info.mock.calls.some((c) => String(c[0]).includes("[PLAYBACK_DIAG]"))
    ).toBe(false);
    openQaDiagGate();
    playbackDiagLog("info", "loud-when-open");
    expect(
      info.mock.calls.some(
        (c) =>
          String(c[0]).includes("[PLAYBACK_DIAG]") &&
          String(c[1]).includes("info")
      )
    ).toBe(true);
  });
});
