import { useCallback, useRef } from "react";

/**
 * Radix `Dialog.Content` auto-focuses a child (usually the close button) or
 * itself the instant a popup opens. Browsers often paint a visible
 * `:focus-visible` ring for that programmatic focus even when the popup was
 * opened by mouse/hover, not the keyboard — the gold ring flashing around
 * the × on shell popups (About UXML, CJM compatibility) on every open.
 *
 * Works via a callback ref rather than `useEffect` reading a `.current`
 * ref: Radix mounts `Dialog.Content` through `Presence`, so the DOM node
 * can attach in a later commit than the one that flips `open` — a plain
 * effect keyed on `open` can run before the ref is populated and silently
 * no-op. A callback ref fires exactly when the node attaches/detaches, so
 * it's correct regardless of that timing.
 *
 * Sets `data-studio-suppress-focus-ring="true"` on attach — the panel's own
 * CSS turns off every focus ring inside while that's set
 * (`studioNavPolish.css`) — then removes it on the first real keydown
 * inside (genuine keyboard use, e.g. Tab to the next control), so normal
 * focus-visible styling resumes for real navigation.
 */
export function useSuppressDialogAutoFocusRing<T extends HTMLElement>(): {
  panelRef: (node: T | null) => void;
} {
  const cleanupRef = useRef<(() => void) | null>(null);

  const panelRef = useCallback((node: T | null) => {
    cleanupRef.current?.();
    cleanupRef.current = null;
    if (!node) return;
    node.setAttribute("data-studio-suppress-focus-ring", "true");
    const clear = () => node.removeAttribute("data-studio-suppress-focus-ring");
    node.addEventListener("keydown", clear, { once: true });
    cleanupRef.current = () => node.removeEventListener("keydown", clear);
  }, []);

  return { panelRef };
}
