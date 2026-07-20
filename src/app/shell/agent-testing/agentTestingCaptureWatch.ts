/**
 * Lean page-click + screen-nav watch for the QA overlay visible log.
 * Full detail stays in the diag ring via the overlay; this only emits short labels.
 */

const OVERLAY_ROOT_ID = "agent-testing-overlay";
const SCREEN_POLL_MS = 400;

export type AgentTestingCaptureWatchHandlers = {
  /** True when clicks/nav should land in the visible log. */
  isCapturing: () => boolean;
  onClick: (label: string) => void;
  onScreen: (screenId: string) => void;
};

function readScreenId(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const fromUrl = new URL(window.location.href).searchParams.get("screen");
    if (fromUrl?.trim()) return fromUrl.trim();
  } catch {
    /* ignore */
  }
  return null;
}

function shortText(raw: string, max = 42): string {
  const t = raw.replace(/\s+/g, " ").trim();
  if (!t) return "";
  return t.length > max ? `${t.slice(0, max - 1)}…` : t;
}

function isIgnoredTarget(el: Element | null): boolean {
  if (!el || typeof el.closest !== "function") return true;
  if (el.closest(`#${OVERLAY_ROOT_ID}`)) return true;
  if (el.closest(".studio-nav-panel, .studio-nav-version, [data-studio-nav]")) {
    return true;
  }
  if (el.closest("[data-studio-agent-testing-ignore]")) return true;
  return false;
}

/** Prefer human affordance text over raw tag names. */
export function describeClickTarget(el: Element): string {
  const labelled =
    el.closest<HTMLElement>(
      "button, a, [role='button'], [role='link'], label, summary, input, select, textarea"
    ) ?? (el as HTMLElement);

  const aria =
    labelled.getAttribute?.("aria-label")?.trim() ||
    labelled.getAttribute?.("title")?.trim() ||
    "";
  if (aria) return shortText(aria);

  if (labelled instanceof HTMLInputElement) {
    const v = labelled.value?.trim();
    if (labelled.type === "submit" || labelled.type === "button") {
      return shortText(v || labelled.name || labelled.type);
    }
    if (labelled.placeholder) return shortText(labelled.placeholder);
  }

  const text = shortText(labelled.textContent || "");
  if (text) return text;

  const studio =
    labelled.getAttribute?.("data-studio-action") ||
    labelled.getAttribute?.("data-studio-screen") ||
    labelled.getAttribute?.("name") ||
    "";
  if (studio) return shortText(studio);

  const tag = labelled.tagName?.toLowerCase?.() || "element";
  return tag;
}

/**
 * Bind capture-phase click + screen poll. Returns unbind.
 * Safe to call repeatedly — previous bind is replaced by caller unbind.
 */
export function bindAgentTestingCaptureWatch(
  handlers: AgentTestingCaptureWatchHandlers
): () => void {
  if (
    typeof document === "undefined" ||
    typeof window === "undefined" ||
    typeof document.addEventListener !== "function" ||
    typeof document.removeEventListener !== "function"
  ) {
    return () => undefined;
  }

  let lastScreen = readScreenId();

  const onClick = (event: MouseEvent) => {
    if (!handlers.isCapturing()) return;
    const target = event.target;
    if (!(target instanceof Element)) return;
    if (isIgnoredTarget(target)) return;
    const desc = describeClickTarget(target);
    if (!desc) return;
    handlers.onClick(`Click: ${desc}`);
  };

  const pollScreen = () => {
    if (!handlers.isCapturing()) return;
    const next = readScreenId();
    if (!next || next === lastScreen) return;
    lastScreen = next;
    handlers.onScreen(`Screen → ${next}`);
  };

  document.addEventListener("click", onClick, true);
  const timer =
    typeof window.setInterval === "function"
      ? window.setInterval(pollScreen, SCREEN_POLL_MS)
      : null;

  return () => {
    document.removeEventListener("click", onClick, true);
    if (timer != null && typeof window.clearInterval === "function") {
      window.clearInterval(timer);
    }
  };
}
