/** @vitest-environment happy-dom */
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  removeDemoCursor,
  setDemoCursorJourneyMode,
} from "@/app/scenario/demoCursor";
import {
  clearPoSignal,
  installPoSignalWindowApis,
  peekPoSignal,
  uninstallPoSignalWindowApis,
} from "@/app/shell/agent-testing/agentTestingPoSignal";
import { playbackDiagClear } from "@/app/shell/playbackDiag";
import {
  beginTypeInCursorGuard,
  reportTypeInCursorVisibility,
  resetTypeInCursorGuard,
  tickTypeInCursorGuard,
} from "@/app/shell/typeInCursorGuard";

describe("typeInCursorGuard", () => {
  afterEach(() => {
    resetTypeInCursorGuard();
    clearPoSignal();
    uninstallPoSignalWindowApis();
    setDemoCursorJourneyMode(false);
    removeDemoCursor({ immediate: true });
    playbackDiagClear();
    vi.restoreAllMocks();
  });

  it("parks visible cursor outside field bbox when CJM on", () => {
    vi.spyOn(console, "info").mockImplementation(() => {});
    setDemoCursorJourneyMode(true, { parkAfterInteraction: true });
    const ta = document.createElement("textarea");
    document.body.appendChild(ta);
    Object.defineProperty(ta, "getBoundingClientRect", {
      value: () => ({
        left: 100,
        top: 200,
        right: 400,
        bottom: 260,
        width: 300,
        height: 60,
        x: 100,
        y: 200,
        toJSON: () => ({}),
      }),
    });

    beginTypeInCursorGuard(ta);
    const el = document.querySelector<HTMLElement>(".proto-chat-demo-cursor");
    expect(el).not.toBeNull();
    expect(el!.classList.contains("proto-chat-demo-cursor--parked")).toBe(true);
    expect(el!.style.opacity === "" || Number(el!.style.opacity) > 0).toBe(true);
    const left = Number.parseFloat(el!.style.left);
    const top = Number.parseFloat(el!.style.top);
    // Outside [100,400]×[200,260] — right-of-field park at ~428, midY 230.
    expect(left).toBeGreaterThanOrEqual(400);
    expect(top).toBeGreaterThanOrEqual(200);
    expect(top).toBeLessThanOrEqual(260);
    const left0 = el!.style.left;
    tickTypeInCursorGuard(ta, 40);
    tickTypeInCursorGuard(ta, 80);
    expect(el!.style.left).toBe(left0);
    expect(el!.classList.contains("proto-chat-demo-cursor--parked")).toBe(true);
    ta.remove();
  });

  it("latches CURSOR_HIDDEN_DURING_TYPEIN when cursor missing mid type-in", () => {
    vi.spyOn(console, "info").mockImplementation(() => {});
    vi.spyOn(console, "warn").mockImplementation(() => {});
    installPoSignalWindowApis();
    setDemoCursorJourneyMode(true, { parkAfterInteraction: true });
    removeDemoCursor({ immediate: true });

    const visible = reportTypeInCursorVisibility("progress");
    expect(visible).toBe(false);
    expect(peekPoSignal()?.code).toBe("CURSOR_HIDDEN_DURING_TYPEIN");
  });
});
