/** Scenario playback — reusable shell for stepped “frame” reveals on prototype screens. */

/** Minimum revealed frames — chat never shows a blank thread (first bubble stays). */
export const PROTO_SCENARIO_MIN_VISIBLE_FRAMES = 1;

export type ProtoScenarioScreenConfig = {
  id: string;
  label: string;
  childIndex: number;
  minVisibleFrames?: number;
  /** Ms between frames when “play” is triggered. */
  playbackStepMs?: number;
};

export const PROTO_SCENARIO_SCREENS: ProtoScenarioScreenConfig[] = [
  {
    id: "site-pilot-chat",
    label: "Chat experience",
    childIndex: 10,
    minVisibleFrames: 1,
    playbackStepMs: 2000,
  },
];

export function getProtoScenarioForChildIndex(
  childIndex: number
): ProtoScenarioScreenConfig | undefined {
  return PROTO_SCENARIO_SCREENS.find((s) => s.childIndex === childIndex);
}

export const PROTO_SCENARIO_FRAME_ANIM_MS = 320;

function clearFrameHideTimer(frame: HTMLElement): void {
  const id = frame.dataset.protoScenarioHideTid;
  if (!id) return;
  window.clearTimeout(Number(id));
  delete frame.dataset.protoScenarioHideTid;
}

export function applyScenarioFrameVisibility(
  frames: HTMLElement[],
  visibleCount: number
): void {
  frames.forEach((frame, index) => {
    const visible = index < visibleCount;
    const wasVisible = frame.dataset.protoScenarioVisible === "true";
    const wasHidden = frame.dataset.protoScenarioVisible === "false";

    frame.classList.add("proto-scenario-frame");
    frame.dataset.protoScenarioFrame = String(index + 1);

    if (visible) {
      clearFrameHideTimer(frame);
      frame.style.display = "";
      if (wasHidden) {
        frame.classList.add("proto-scenario-frame--hidden");
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            frame.classList.remove("proto-scenario-frame--hidden");
          });
        });
      } else {
        frame.classList.remove("proto-scenario-frame--hidden");
      }
      frame.dataset.protoScenarioVisible = "true";
      return;
    }

    if (!wasVisible && !wasHidden) {
      frame.style.display = "none";
      frame.classList.add("proto-scenario-frame--hidden");
      frame.dataset.protoScenarioVisible = "false";
      return;
    }

    frame.classList.add("proto-scenario-frame--hidden");
    frame.dataset.protoScenarioVisible = "false";

    const hideAfterTransition = () => {
      if (frame.dataset.protoScenarioVisible === "false") {
        frame.style.display = "none";
      }
      delete frame.dataset.protoScenarioHideTid;
    };

    const onEnd = (event: TransitionEvent) => {
      if (event.target !== frame) return;
      if (event.propertyName !== "opacity") return;
      frame.removeEventListener("transitionend", onEnd);
      hideAfterTransition();
    };

    frame.addEventListener("transitionend", onEnd);
    frame.dataset.protoScenarioHideTid = String(
      window.setTimeout(hideAfterTransition, PROTO_SCENARIO_FRAME_ANIM_MS + 50)
    );
  });
}

export type ScenarioScrollAlign = "start" | "center" | "end";

/** Scroll the prototype pane to top (e.g. jump-to-first-frame). */
export function scrollPrototypeScrollToTop(
  scrollEl?: HTMLElement | null,
  behavior: ScrollBehavior = "instant"
): void {
  const el =
    scrollEl ??
    document.querySelector<HTMLElement>(".proto-scroll--prototype:not(.hidden)") ??
    document.querySelector<HTMLElement>(".proto-scroll--prototype");
  if (!el) return;

  const apply = () => {
    el.scrollTop = 0;
    el.scrollLeft = 0;
    el.scrollTo({ top: 0, left: 0, behavior });
  };

  apply();
  requestAnimationFrame(apply);
  window.setTimeout(apply, 0);
}

export function scrollPrototypeScrollToTopAfterLayout(
  scrollEl?: HTMLElement | null
): void {
  scrollPrototypeScrollToTop(scrollEl, "instant");
  window.setTimeout(
    () => scrollPrototypeScrollToTop(scrollEl, "instant"),
    PROTO_SCENARIO_FRAME_ANIM_MS + 80
  );
}

/** Scroll the prototype pane to the bottom (show latest chat bubbles above composer). */
export function scrollPrototypeScrollToBottom(
  scrollEl?: HTMLElement | null,
  behavior: ScrollBehavior = "instant"
): void {
  const el =
    scrollEl ??
    document.querySelector<HTMLElement>(".proto-scroll--prototype:not(.hidden)") ??
    document.querySelector<HTMLElement>(".proto-scroll--prototype");
  if (!el) return;

  const top = Math.max(0, el.scrollHeight - el.clientHeight);
  el.scrollTop = top;
  el.scrollTo({ top, left: 0, behavior });
}

/** One-shot bottom scroll after layout settles (initial load / jump to end). */
export function scrollPrototypeScrollToBottomOnce(
  scrollEl?: HTMLElement | null
): void {
  scrollPrototypeScrollToBottom(scrollEl, "instant");
  window.setTimeout(
    () => scrollPrototypeScrollToBottom(scrollEl, "instant"),
    PROTO_SCENARIO_FRAME_ANIM_MS + 80
  );
}

export function scrollScenarioFrameIntoView(
  frame: HTMLElement | null,
  align: ScenarioScrollAlign = "end"
): void {
  if (!frame) return;
  frame.scrollIntoView({
    behavior: "smooth",
    block: align === "end" ? "end" : align,
    inline: "nearest",
  });
}

export function scrollScenarioChatAnchor(
  frames: HTMLElement[],
  visibleCount: number,
  align: ScenarioScrollAlign = "end",
  scrollEl?: HTMLElement | null
): void {
  if (align === "start") {
    scrollPrototypeScrollToTopAfterLayout(scrollEl);
    return;
  }

  if (visibleCount > 0) {
    const lastFrame = frames[visibleCount - 1] ?? null;
    if (lastFrame) {
      lastFrame.scrollIntoView({
        behavior: "instant",
        block: "end",
        inline: "nearest",
      });
    }
    return;
  }

  const anchor =
    frames[0]?.closest<HTMLElement>('[data-name="component.appointment.summary"]') ??
    frames[0]?.parentElement;
  anchor?.scrollIntoView({ behavior: "smooth", block: "start", inline: "nearest" });
}
