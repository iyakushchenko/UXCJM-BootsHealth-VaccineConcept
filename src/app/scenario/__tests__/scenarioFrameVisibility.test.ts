/** @vitest-environment happy-dom */
import { afterEach, describe, expect, it } from "vitest";
import { applyScenarioFrameVisibility } from "@/app/scenario/scenarioEngine";

function makeFrames(count: number): HTMLElement[] {
  return Array.from({ length: count }, (_, index) => {
    const el = document.createElement("div");
    el.setAttribute("data-name", index % 2 === 0 ? "query" : "reply");
    el.setAttribute("data-studio-chat-frame", `f${index}`);
    el.textContent = `frame ${index}`;
    document.body.appendChild(el);
    return el;
  });
}

describe("applyScenarioFrameVisibility progressive disclosure", () => {
  afterEach(() => {
    document.body.replaceChildren();
  });

  it("hides never-shown frames immediately (no full-thread dump window)", () => {
    const frames = makeFrames(4);
    applyScenarioFrameVisibility(frames, 1);

    expect(frames[0].dataset.studioScenarioVisible).toBe("true");
    expect(frames[0].style.display).not.toBe("none");
    expect(frames[0].classList.contains("proto-scenario-frame--hidden")).toBe(
      false
    );

    for (const frame of frames.slice(1)) {
      expect(frame.dataset.studioScenarioVisible).toBe("false");
      expect(frame.style.display).toBe("none");
      expect(frame.classList.contains("proto-scenario-frame--hidden")).toBe(
        true
      );
    }
  });

  it("reveals the next frame when visibleCount advances", () => {
    const frames = makeFrames(3);
    applyScenarioFrameVisibility(frames, 1);
    applyScenarioFrameVisibility(frames, 2);

    expect(frames[0].dataset.studioScenarioVisible).toBe("true");
    expect(frames[1].dataset.studioScenarioVisible).toBe("true");
    expect(frames[1].style.display).not.toBe("none");
    expect(frames[2].style.display).toBe("none");
  });
});
