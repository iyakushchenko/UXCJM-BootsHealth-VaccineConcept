/**
 * MCP prove — robo-cursor native hover + press on any interactive target.
 * Auto-Rule R10: everywhere, not chat-only.
 */
import {
  isDemoCursorPointerMode,
  simulateDemoPointerClick,
  simulateDemoPointerHover,
} from "@/app/scenario/demoCursor";

export type ProveRoboCursorFeedbackResult = {
  pass: boolean;
  hoverClass: boolean;
  hoverStyleChanged: boolean;
  pressSeen: boolean;
  pointerClearedAfterClick: boolean;
  detail: string;
};

export async function proveRoboCursorFeedback(
  selector?: string
): Promise<ProveRoboCursorFeedbackResult> {
  const el = document.querySelector<HTMLElement>(
    selector ||
      ".proto-avail-header .proto-popup-close, .studio-tertiary-cta, .pdp__pill, [data-name='component.input.button'], button"
  );
  if (!el) {
    return {
      pass: false,
      hoverClass: false,
      hoverStyleChanged: false,
      pressSeen: false,
      pointerClearedAfterClick: false,
      detail: "no target",
    };
  }

  const beforeBg = getComputedStyle(el).backgroundColor;
  const beforeColor = getComputedStyle(el).color;
  const beforeBorder = getComputedStyle(el).borderTopColor;
  let hoverClass = false;
  let hoverStyleChanged = false;

  const hovered = await simulateDemoPointerHover(el, 480, {
    scroll: true,
    onHoverStart: (root) => {
      hoverClass =
        root.classList.contains("proto-chat-cta--hover") ||
        root.getAttribute("data-studio-robo-hover") === "true";
      const bg = getComputedStyle(root).backgroundColor;
      const color = getComputedStyle(root).color;
      const border = getComputedStyle(root).borderTopColor;
      // Secondary/outline CTAs often change bg/border, not text color.
      hoverStyleChanged =
        bg !== beforeBg || color !== beforeColor || border !== beforeBorder;
    },
  });

  let pressSeen = false;
  const onDown = () => {
    pressSeen =
      el.classList.contains("proto-chat-cta--pressed") &&
      el.classList.contains("proto-chat-cta--hover");
  };
  el.addEventListener("pointerdown", onDown, { once: true });

  const clicked = await simulateDemoPointerClick(el, { scroll: true });
  const pointerClearedAfterClick = !isDemoCursorPointerMode();
  const pass =
    hovered &&
    clicked &&
    hoverClass &&
    hoverStyleChanged &&
    pressSeen &&
    pointerClearedAfterClick;

  return {
    pass,
    hoverClass,
    hoverStyleChanged,
    pressSeen,
    pointerClearedAfterClick,
    detail: pass
      ? "robo-cursor native feedback OK"
      : `hover=${hovered}/${hoverClass}/${hoverStyleChanged} click=${clicked} press=${pressSeen} pointerCleared=${pointerClearedAfterClick}`,
  };
}
