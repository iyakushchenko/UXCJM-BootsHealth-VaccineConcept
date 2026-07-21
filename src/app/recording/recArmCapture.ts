/**
 * Honest REC arm — PO UI sequence only.
 *
 * CJM off → REC mode ON → CREATE NEW CJM → ● Start
 * FAIL unless switch + session are both truly live.
 */

import { selectCreateNewCjm } from "@/app/recording/createNewCjmApi";
import {
  isRecordingActive,
  isRecordingPaused,
  startRecording,
  type StartRecordingOptions,
} from "@/app/recording/recordingSession";
import { logAgentTestingStep } from "@/app/shell/agent-testing";

export type RecLiveAssert = {
  ok: boolean;
  recMode: boolean;
  recording: boolean;
  createNew: boolean;
  startVisible: boolean;
  overlayRecLive: boolean;
  reason?: string;
};

export type ArmRecCaptureResult = RecLiveAssert & {
  sessionId?: string;
};

export type RecArmCaptureHooks = {
  setJourneyMode: (enabled: boolean) => void;
  setRecMode: (enabled: boolean) => void;
  getStartOptions?: () => StartRecordingOptions;
  /** Settle delay after React state flips (ms). */
  settleMs?: number;
};

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

function readRecSwitch(): HTMLElement | null {
  return document.querySelector<HTMLElement>(
    '[role="switch"][aria-label="REC on"], [role="switch"][aria-label="REC off"]'
  );
}

function isRecModeOnInDom(): boolean {
  const sw = readRecSwitch();
  if (!sw) return false;
  return (
    sw.getAttribute("aria-label") === "REC on" &&
    sw.getAttribute("aria-checked") === "true"
  );
}

function isCreateNewSelectedInDom(): boolean {
  const menu = document.querySelector<HTMLElement>(
    ".studio-nav-journey-menu, [data-studio-new-cjm]"
  );
  if (menu?.hasAttribute("data-studio-new-cjm")) return true;
  if (menu?.classList.contains("studio-nav-journey-menu--new-cjm")) return true;
  const trigger = document.querySelector<HTMLElement>(
    '[aria-label="Orchestra mode"], .studio-nav-journey-menu__trigger'
  );
  if (!trigger) return false;
  const text = (trigger.textContent ?? "").toUpperCase();
  return text.includes("CREATE NEW") || text.includes("NEW CJM");
}

function startRecordingButton(): HTMLButtonElement | null {
  return document.querySelector<HTMLButtonElement>(
    'button[aria-label="Start recording"]'
  );
}

function overlayRecLive(): boolean {
  const root = document.querySelector<HTMLElement>(
    ".studio-agent-testing-overlay, [data-studio-agent-testing]"
  );
  if (!root) return false;
  return root.getAttribute("data-rec") === "live";
}

function isCjmOnInDom(): boolean {
  const sw = document.querySelector<HTMLElement>(
    '[role="switch"][aria-label="CJM"]'
  );
  return sw?.getAttribute("aria-checked") === "true";
}

/**
 * Truth latch — REC switch ON + live (or paused) session.
 * Chrome-only / session-only without switch = FAIL.
 */
export function assertRecLive(): RecLiveAssert {
  const recMode = isRecModeOnInDom();
  const recording = isRecordingActive() || isRecordingPaused();
  const createNew = isCreateNewSelectedInDom();
  const startVisible = startRecordingButton() != null;
  const overlay = overlayRecLive();
  if (!recMode) {
    return {
      ok: false,
      recMode,
      recording,
      createNew,
      startVisible,
      overlayRecLive: overlay,
      reason: "REC switch not ON (aria-label=REC on + aria-checked=true)",
    };
  }
  if (!recording) {
    return {
      ok: false,
      recMode,
      recording,
      createNew,
      startVisible,
      overlayRecLive: overlay,
      reason: "recording session not live (isRecordingActive/paused false)",
    };
  }
  return {
    ok: true,
    recMode,
    recording,
    createNew,
    startVisible,
    overlayRecLive: overlay,
  };
}

/**
 * Arm REC the PO way: CJM off → REC on → CREATE NEW → ● Start.
 * Prefer clicking Start when visible; else startRecording after deck is armed.
 */
export async function armRecCapture(
  hooks: RecArmCaptureHooks
): Promise<ArmRecCaptureResult> {
  const settle = hooks.settleMs ?? 80;

  // 1) CJM must be off (REC locked while CJM/AIR/play).
  if (isCjmOnInDom()) {
    hooks.setJourneyMode(false);
    await delay(settle);
  }

  // 2) REC mode ON — prefer real switch click (PO UI), then React hook.
  const recSwitch = readRecSwitch();
  if (recSwitch && !isRecModeOnInDom() && !recSwitch.hasAttribute("disabled")) {
    recSwitch.click();
    await delay(settle);
  }
  if (!isRecModeOnInDom()) {
    hooks.setRecMode(true);
    await delay(settle);
  }

  // 3) CREATE NEW CJM (same path as orchestra picker).
  const selected = selectCreateNewCjm();
  if (!selected) {
    const fail: ArmRecCaptureResult = {
      ok: false,
      recMode: isRecModeOnInDom(),
      recording: isRecordingActive(),
      createNew: false,
      startVisible: false,
      overlayRecLive: overlayRecLive(),
      reason: "CREATE NEW CJM selector not registered",
    };
    logArm(fail);
    return fail;
  }
  await delay(settle);

  // Ensure REC mode still latched after CREATE NEW.
  if (!isRecModeOnInDom()) {
    hooks.setRecMode(true);
    await delay(settle);
  }

  // 4) ● Start — prefer real Start button (CREATE NEW deck).
  if (isRecordingActive() || isRecordingPaused()) {
    const live = assertRecLive();
    logArm(live);
    return live;
  }

  const startBtn = startRecordingButton();
  if (startBtn && !startBtn.disabled) {
    startBtn.click();
    await delay(settle);
  } else {
    // Deck may still be mounting — one settle then retry Start, else FAIL.
    await delay(settle * 2);
    const retry = startRecordingButton();
    if (retry && !retry.disabled) {
      retry.click();
      await delay(settle);
    } else {
      // Last resort: same startRecording the Start button calls (recordedFrom marks arm).
      const defaults = hooks.getStartOptions?.() ?? {};
      startRecording({
        ...defaults,
        metadata: {
          ...defaults.metadata,
          recordedFrom: "arm-rec-capture-ui-fallback",
        },
      });
      await delay(settle);
    }
  }

  const live = assertRecLive();
  if (live.ok) {
    const sessionId =
      (
        window as Window & {
          __protoGetRecording?: () => { id?: string } | null;
        }
      ).__protoGetRecording?.()?.id ?? undefined;
    const ok: ArmRecCaptureResult = { ...live, sessionId };
    logArm(ok);
    return ok;
  }
  logArm(live);
  return live;
}

function logArm(result: ArmRecCaptureResult): void {
  try {
    logAgentTestingStep({
      kind: "rec",
      action: "ArmRecCapture",
      label: result.ok
        ? `REC armed live · switch+session${result.sessionId ? ` · ${result.sessionId}` : ""}`
        : `REC arm FAIL — ${result.reason ?? "not live"}`,
      outcome: result.ok ? "ok" : "fail",
    });
  } catch {
    /* hang-safe */
  }
}
