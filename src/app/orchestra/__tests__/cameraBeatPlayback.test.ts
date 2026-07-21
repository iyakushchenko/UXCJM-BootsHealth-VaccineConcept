/**
 * @vitest-environment happy-dom
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  clearCameraBeatUndo,
  peekCameraBeatUndo,
  playCameraBeat,
  reverseCameraBeat,
} from "@/app/orchestra/cameraBeatPlayback";

describe("cameraBeatPlayback", () => {
  let host: HTMLElement;
  let target: HTMLElement;

  beforeEach(() => {
    clearCameraBeatUndo();
    document.body.innerHTML = "";
    host = document.createElement("div");
    host.className = "studio-scroll--prototype";
    Object.defineProperty(host, "clientHeight", { value: 400, configurable: true });
    Object.defineProperty(host, "scrollHeight", { value: 2000, configurable: true });
    host.scrollTop = 0;
    target = document.createElement("button");
    target.setAttribute("data-studio-open-appointment", "true");
    target.textContent = "Open Appointments";
    Object.defineProperty(target, "getBoundingClientRect", {
      value: () => ({
        top: 900,
        bottom: 940,
        left: 0,
        right: 100,
        width: 100,
        height: 40,
        x: 0,
        y: 900,
        toJSON: () => ({}),
      }),
    });
    host.appendChild(target);
    document.body.appendChild(host);
  });

  afterEach(() => {
    clearCameraBeatUndo();
    vi.restoreAllMocks();
  });

  it("dwell then scrolls; reverse restores fromTop", async () => {
    const result = await playCameraBeat(
      {
        dwellMs: 0,
        selectorChain: ['[data-studio-open-appointment="true"]'],
      },
      { beatId: "book-step3-camera", instant: true }
    );
    expect(result.ok).toBe(true);
    const undo = peekCameraBeatUndo();
    expect(undo?.fromTop).toBe(0);
    expect(undo?.scrollEl).toBeTruthy();

    host.scrollTop = 500;
    const reversed = await reverseCameraBeat({
      instant: true,
      beatId: "book-step3-camera",
    });
    expect(reversed).toBe(true);
    expect(host.scrollTop).toBe(0);
  });

  it("dwell-only without target is ok", async () => {
    const result = await playCameraBeat({ dwellMs: 0 }, { instant: true });
    expect(result.ok).toBe(true);
  });

  it("arms camera dwell latch during non-instant wait then clears", async () => {
    vi.useFakeTimers();
    const mod = await import("@/app/scenario/playbackScroll");
    mod.setCameraBeatDwellActive(false);
    const pending = playCameraBeat(
      { dwellMs: 150 },
      { beatId: "dwell-only", instant: false }
    );
    await Promise.resolve();
    expect(mod.isCameraBeatDwellActive()).toBe(true);
    await vi.advanceTimersByTimeAsync(160);
    const result = await pending;
    expect(result.ok).toBe(true);
    expect(mod.isCameraBeatDwellActive()).toBe(false);
    vi.useRealTimers();
  });

  it("missing / unusable target soft-continues after dwell (no hang)", async () => {
    const result = await playCameraBeat(
      {
        dwellMs: 0,
        selectorChain: ['[data-studio-missing="x"]'],
      },
      { instant: true }
    );
    expect(result.ok).toBe(true);
    expect(result.step).toBe("camera-beat:target-unusable");
  });

  it("skips display:none retired ghosts instead of ghost-scrolling", async () => {
    const ghostWrap = document.createElement("div");
    ghostWrap.style.display = "none";
    const ghost = document.createElement("div");
    ghost.setAttribute("data-name", "module.pdp");
    ghostWrap.appendChild(ghost);
    document.body.appendChild(ghostWrap);

    const result = await playCameraBeat(
      {
        dwellMs: 0,
        anchorSelector: '[data-name="module.pdp"]',
        selectorChain: ['[data-name="module.pdp"]'],
      },
      { instant: true }
    );
    expect(result.ok).toBe(true);
    expect(result.step).toBe("camera-beat:target-unusable");
  });
});
