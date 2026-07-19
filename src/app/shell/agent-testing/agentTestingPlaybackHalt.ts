/**
 * PO Alarm / Cursor / Scroll / diagnostic Cancel → synchronous Play halt.
 * Must not wait for smoke poll. Latch stays for agent consume.
 */

import { cancelDemoCursorTravel } from "@/app/scenario/demoCursor";
import { cancelPlaybackScroll } from "@/app/scenario/playbackScroll";
import { latchPoSignal } from "@/app/shell/agent-testing/agentTestingPoSignal";

type HaltFn = () => void;

let registeredHalt: HaltFn | null = null;

/** App registers stopAllPlayback (journey + scenario abort). */
export function registerPoSignalPlaybackHalt(fn: HaltFn | null): void {
  registeredHalt = fn;
}

/**
 * Hard-stop cassette / scenario Play immediately.
 * Safe to call from overlay click handlers (sync, hang-safe).
 */
export function haltPlaybackForPoSignal(reason = "po-signal"): void {
  try {
    registeredHalt?.();
  } catch {
    /* hang-safe */
  }

  // Fallback if App has not registered yet (early click / tests).
  try {
    if (typeof window !== "undefined") {
      const w = window as Window & {
        __protoStudioState?: () => {
          isPlaying?: boolean;
          isOnAir?: boolean;
        };
        __studioStudioState?: () => {
          isPlaying?: boolean;
          isOnAir?: boolean;
        };
        __protoTriggerTransport?: (action: "play") => boolean;
        __studioTriggerTransport?: (action: "play") => boolean;
      };
      const state = w.__studioStudioState?.() ?? w.__protoStudioState?.();
      if (state?.isPlaying || state?.isOnAir) {
        (w.__studioTriggerTransport ?? w.__protoTriggerTransport)?.("play");
      }
    }
  } catch {
    /* hang-safe */
  }

  try {
    cancelDemoCursorTravel();
  } catch {
    /* hang-safe */
  }

  try {
    cancelPlaybackScroll();
  } catch {
    /* hang-safe */
  }

  try {
    console.warn(
      "[AGENT_TESTING] playback halted synchronously",
      reason,
      "→ latch remains for __studioConsumePoSignal()"
    );
  } catch {
    /* ignore */
  }
}

/**
 * User Cancel / MCP dismiss of PLAYBACK DIAGNOSTIC:
 * hard-stop Play + latch DIAGNOSTIC_ACK_STOP (alarm-class abort for smokes).
 */
export function acknowledgePlaybackDiagnosticStop(note?: string): void {
  haltPlaybackForPoSignal("diagnostic-ack");
  try {
    latchPoSignal({
      type: "alarm",
      code: "DIAGNOSTIC_ACK_STOP",
      note: note?.trim() || "playback diagnostic dismissed",
    });
  } catch {
    /* hang-safe */
  }
}

export function installPoSignalPlaybackHaltWindowApis(): void {
  if (typeof window === "undefined") return;
  const w = window as Window & {
    __studioHaltPlaybackForPoSignal?: typeof haltPlaybackForPoSignal;
    __protoHaltPlaybackForPoSignal?: typeof haltPlaybackForPoSignal;
  };
  w.__studioHaltPlaybackForPoSignal = haltPlaybackForPoSignal;
  w.__protoHaltPlaybackForPoSignal = haltPlaybackForPoSignal;
}

export function uninstallPoSignalPlaybackHaltWindowApis(): void {
  registeredHalt = null;
  if (typeof window === "undefined") return;
  const w = window as Window & {
    __studioHaltPlaybackForPoSignal?: unknown;
    __protoHaltPlaybackForPoSignal?: unknown;
  };
  delete w.__studioHaltPlaybackForPoSignal;
  delete w.__protoHaltPlaybackForPoSignal;
}
