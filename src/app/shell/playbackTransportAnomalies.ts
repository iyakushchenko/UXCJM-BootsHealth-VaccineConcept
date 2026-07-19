import { isAllowedTouchpointAheadOfBeat } from "@/app/nav/resolveStudioTouchpoint";

export type TransportAnomalyKind =
  | "playlist-frame-skip"
  | "touchpoint-ahead-of-beat"
  | "director-script-off-air"
  | "stray-popup-on-beat";

export type TransportAnomaly = {
  kind: TransportAnomalyKind;
  message: string;
  detail?: string;
};

/** Manual director chains that legitimately skip playlist frames in a single step. */
function isAllowedPlaylistFrameSkip(options: {
  prevTouchpointKey?: string;
  nextTouchpointKey: string;
  delta: number;
}): boolean {
  // Chat virtual finale → Availability date (skips remaining chat playlist slots).
  if (
    options.prevTouchpointKey?.startsWith("beat:agentic-chat:frame:") &&
    (options.nextTouchpointKey.startsWith("popup:availability:") ||
      options.nextTouchpointKey === "beat:avail-continue" ||
      options.nextTouchpointKey === "beat:avail-location")
  ) {
    return true;
  }

  if (options.delta !== 2) return false;
  if (options.nextTouchpointKey !== "beat:appointment-details") return false;
  return (
    options.prevTouchpointKey === "beat:confirmation" ||
    options.prevTouchpointKey === "beat:appointment-history"
  );
}

/** One transport step must not jump over playlist frames (e.g. 3/12 → 5/12). */
export function detectPlaylistFrameSkip(options: {
  prevTouchpointIndex: number;
  nextTouchpointIndex: number;
  prevTouchpointKey?: string;
  beatId?: string;
  nextTouchpointKey: string;
}): TransportAnomaly | null {
  const { prevTouchpointIndex, nextTouchpointIndex } = options;
  if (prevTouchpointIndex < 0 || nextTouchpointIndex < 0) return null;

  const delta = nextTouchpointIndex - prevTouchpointIndex;
  if (delta <= 1) return null;
  if (
    isAllowedPlaylistFrameSkip({
      prevTouchpointKey: options.prevTouchpointKey,
      nextTouchpointKey: options.nextTouchpointKey,
      delta,
    })
  ) {
    return null;
  }

  return {
    kind: "playlist-frame-skip",
    message: `Studio playlist skipped ${delta - 1} frame(s) in one transport step`,
    detail: [
      `from=#${prevTouchpointIndex + 1}`,
      `to=#${nextTouchpointIndex + 1}`,
      `touchpoint=${options.nextTouchpointKey}`,
      options.beatId ? `beat=${options.beatId}` : "",
    ]
      .filter(Boolean)
      .join(" "),
  };
}

/** Runtime touchpoint must not outrun the active beat (except allowed popup sub-steps). */
export function detectTouchpointAheadOfBeat(options: {
  beatPlaylistIndex: number;
  touchpointPlaylistIndex: number;
  beatId?: string;
  touchpointKey: string;
}): TransportAnomaly | null {
  const { beatPlaylistIndex, touchpointPlaylistIndex, beatId, touchpointKey } =
    options;
  if (beatPlaylistIndex < 0 || touchpointPlaylistIndex < 0) return null;
  if (isAllowedTouchpointAheadOfBeat(beatId, touchpointKey)) return null;

  const gap = touchpointPlaylistIndex - beatPlaylistIndex;
  // The immediate next playlist frame may open before the beat index advances
  // (e.g. PDP Book now → login popup while still on traditional-pdp).
  if (gap <= 1) return null;

  return {
    kind: "touchpoint-ahead-of-beat",
    message: "Runtime touchpoint is ahead of the active journey beat in the playlist",
    detail: [
      `beatIndex=#${beatPlaylistIndex + 1}`,
      `touchpointIndex=#${touchpointPlaylistIndex + 1}`,
      `touchpoint=${touchpointKey}`,
      beatId ? `beat=${beatId}` : "",
    ]
      .filter(Boolean)
      .join(" "),
  };
}

/** Beat landed but a modal overlay is still open (e.g. availability after choose-location). */
export function detectStrayPopupOnBeat(options: {
  beatId?: string;
  isScripting?: boolean;
  availabilityOpen?: boolean;
  loginPopupOpen?: boolean;
  vaccinePickerOpen?: boolean;
  recipientPickerOpen?: boolean;
  quickViewOpen?: boolean;
}): TransportAnomaly | null {
  if (options.isScripting) return null;
  if (options.beatId !== "book-step2") return null;

  // Stale React `availabilityOpen` without a live scrim is not a stray popup.
  const availScrimLive =
    typeof document !== "undefined" &&
    Boolean(document.querySelector(".studio-avail-scrim, .proto-avail-scrim"));

  const open = [
    options.availabilityOpen && availScrimLive ? "availability" : "",
    options.loginPopupOpen ? "login" : "",
    options.vaccinePickerOpen ? "vaccine picker" : "",
    options.recipientPickerOpen ? "recipient picker" : "",
    options.quickViewOpen ? "quick view" : "",
  ].filter(Boolean);

  if (open.length === 0) return null;

  return {
    kind: "stray-popup-on-beat",
    message: `Popup still open on Book Step 2 (${open.join(", ")})`,
    detail: `beat=${options.beatId}`,
  };
}

/** Director scripts must keep studio transport on-air (green diode / pause icon). */
export function detectDirectorScriptOffAir(options: {
  isScripting: boolean;
  isOnAir: boolean;
  beatId?: string;
  scriptLabel?: string;
}): TransportAnomaly | null {
  if (!options.isScripting || options.isOnAir) return null;

  return {
    kind: "director-script-off-air",
    message: "Director script is running while studio transport is off-air",
    detail: [
      options.beatId ? `beat=${options.beatId}` : "",
      options.scriptLabel ? `script=${options.scriptLabel}` : "",
    ]
      .filter(Boolean)
      .join(" "),
  };
}
