/** Universal interaction truth for robo-cursor REC and playback. */

export type DemoInteractionStateKind =
  | "checkbox"
  | "radio"
  | "switch"
  | "selection";

export type DemoInteractionState = {
  kind: DemoInteractionStateKind;
  value: boolean;
  node: HTMLElement;
};

const NATIVE_ACTION_SELECTOR = [
  "button",
  "a[href]",
  "input:not([type='hidden'])",
  "select",
  "textarea",
  "label[for]",
  "label:has(input)",
  "summary",
  "option",
  "[contenteditable='true']",
  "[role='button']",
  "[role='link']",
  "[role='checkbox']",
  "[role='radio']",
  "[role='switch']",
  "[role='tab']",
  "[role='option']",
  "[data-studio-action]",
].join(",");

const STATE_SELECTOR = [
  "input[type='checkbox']",
  "input[type='radio']",
  "option",
  "[aria-checked]",
  "[aria-pressed]",
  "[aria-selected]",
  "[data-checkbox-checked]",
  "[data-radio-checked]",
  "[data-studio-cal-selected]",
  "[data-studio-selected]",
  "[data-selected]",
].join(",");

function boolValue(value: string | null | undefined): boolean | null {
  if (value === "true" || value === "on" || value === "checked" || value === "selected") return true;
  if (value === "false" || value === "off" || value === "unchecked" || value === "unselected") return false;
  return null;
}

function stateNodeFor(target: HTMLElement): HTMLElement | null {
  if (typeof target.matches !== "function") return null;
  if (target.matches(STATE_SELECTOR)) return target;
  const host = target.closest<HTMLElement>(
    "button, label, [role='checkbox'], [role='radio'], [role='switch'], [role='tab'], [role='option']"
  );
  if (host?.matches(STATE_SELECTOR)) return host;
  const candidates = [
    typeof target.querySelector === "function"
      ? target.querySelector<HTMLElement>(STATE_SELECTOR)
      : null,
    host && typeof host.querySelector === "function"
      ? host.querySelector<HTMLElement>(STATE_SELECTOR)
      : null,
  ];
  return candidates.find((candidate): candidate is HTMLElement => Boolean(candidate)) ?? null;
}

/** Read interaction state whose click is expected to produce a transition. */
export function readDemoInteractionState(target: HTMLElement): DemoInteractionState | null {
  const node = stateNodeFor(target);
  if (!node) return null;

  if (node instanceof HTMLInputElement) {
    if (node.type === "checkbox") return { kind: "checkbox", value: node.checked, node };
    if (node.type === "radio") return { kind: "radio", value: node.checked, node };
  }
  if (node instanceof HTMLOptionElement) return { kind: "selection", value: node.selected, node };

  const role = node.getAttribute("role") ?? target.getAttribute("role");
  const checkbox = boolValue(
    node.getAttribute("data-checkbox-checked") ??
      target.getAttribute("data-checkbox-checked") ??
      node.querySelector<HTMLElement>("[data-checkbox-checked]")?.getAttribute("data-checkbox-checked")
  );
  if (checkbox != null) return { kind: "checkbox", value: checkbox, node };

  const radio = boolValue(node.getAttribute("data-radio-checked") ?? target.getAttribute("data-radio-checked"));
  if (radio != null) return { kind: "radio", value: radio, node };

  const checked = boolValue(node.getAttribute("aria-checked") ?? target.getAttribute("aria-checked"));
  if (checked != null) {
    return {
      kind: role === "radio" ? "radio" : role === "switch" ? "switch" : "checkbox",
      value: checked,
      node,
    };
  }

  const pressed = boolValue(node.getAttribute("aria-pressed") ?? target.getAttribute("aria-pressed"));
  if (pressed != null) {
    return { kind: "checkbox", value: pressed, node };
  }

  const selected = boolValue(
    node.getAttribute("data-studio-cal-selected") ??
      target.getAttribute("data-studio-cal-selected") ??
      node.getAttribute("data-studio-selected") ??
      target.getAttribute("data-studio-selected") ??
      node.getAttribute("data-selected") ??
      target.getAttribute("data-selected") ??
      node.getAttribute("aria-selected") ??
      target.getAttribute("aria-selected")
  );
  return selected == null ? null : { kind: "selection", value: selected, node };
}

/** Selected radio/tab/date/time options are idempotent no-ops, not actions. */
export function isAlreadySelectedNoopTarget(target: HTMLElement): boolean {
  const state = readDemoInteractionState(target);
  return Boolean(state?.value && (state.kind === "radio" || state.kind === "selection"));
}

/** A visible DOM box still needs a semantic/native action contract. */
export function hasDemoInteractionContract(target: HTMLElement): boolean {
  if (target.matches(NATIVE_ACTION_SELECTOR)) return true;
  if (target.onclick || target.hasAttribute("onclick")) return true;
  if (target.tabIndex >= 0) return true;
  try {
    return window.getComputedStyle(target).cursor === "pointer";
  } catch {
    return false;
  }
}

/** Visible-content click point; avoids the empty centre of full-width links. */
export function resolveDemoTargetPoint(target: HTMLElement): { x: number; y: number } {
  const box = target.getBoundingClientRect();
  const fallback = { x: box.left + box.width / 2, y: box.top + box.height / 2 };
  if (box.width < 120 || !target.matches("a[href], button, [role='link'], [role='button']")) return fallback;

  try {
    const walker = document.createTreeWalker(target, NodeFilter.SHOW_TEXT);
    let text = walker.nextNode();
    while (text) {
      if ((text.textContent ?? "").trim()) {
        const range = document.createRange();
        range.selectNodeContents(text);
        const visible = Array.from(range.getClientRects?.() ?? []).find(
          (rect) => rect.width > 1 && rect.height > 1 && rect.right >= box.left && rect.left <= box.right && rect.bottom >= box.top && rect.top <= box.bottom
        );
        if (visible) {
          return {
            x: Math.min(box.right - 2, Math.max(box.left + 2, visible.left + visible.width / 2)),
            y: Math.min(box.bottom - 2, Math.max(box.top + 2, visible.top + visible.height / 2)),
          };
        }
      }
      text = walker.nextNode();
    }
  } catch {
    /* DOM range support is optional; geometric centre remains the fallback. */
  }
  return fallback;
}

/** Stateful controls must visibly change; a synthetic press alone is not PASS. */
export async function waitForDemoInteractionStateChange(
  target: HTMLElement,
  before: DemoInteractionState,
  timeoutMs = 480
): Promise<boolean> {
  const started = performance.now();
  while (performance.now() - started <= timeoutMs) {
    const after = readDemoInteractionState(target);
    if (after && after.kind === before.kind && after.value !== before.value) return true;
    await new Promise((resolve) => window.setTimeout(resolve, 20));
  }
  return false;
}
