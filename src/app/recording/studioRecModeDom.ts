/**
 * DOM truth for Studio nav REC mode — same chrome the PO sees.
 * Used to gate startRecording and arm helpers (no silent session without switch ON).
 */

export function readStudioRecSwitch(): HTMLElement | null {
  if (typeof document === "undefined") return null;
  return document.querySelector<HTMLElement>(
    '[role="switch"][aria-label="REC on"], [role="switch"][aria-label="REC off"]'
  );
}

/** True when nav REC switch shows ON (aria-label + aria-checked). */
export function isStudioRecModeOnInDom(): boolean {
  const sw = readStudioRecSwitch();
  if (!sw) return false;
  return (
    sw.getAttribute("aria-label") === "REC on" &&
    sw.getAttribute("aria-checked") === "true"
  );
}

/** Playback cassette chrome — present only when REC mode is off. */
export function isStudioPlaybackPanelVisible(): boolean {
  if (typeof document === "undefined") return false;
  return (
    document.querySelector<HTMLElement>("[data-studio-playback-panel]") != null
  );
}

export const REC_MODE_OFF_REFUSE_MESSAGE =
  "REC refuse — nav REC switch is OFF (aria-label must be REC on + aria-checked=true). Turn REC on in Studio nav first.";
