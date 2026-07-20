/**
 * QA watch — CJM-off saved-chat load must not dump-all without platform
 * content-load interim (`STUDIO_CONTENT_LOAD_MS`).
 *
 * **CJM-on Play / SF progressive reveal is out of scope** — do NOT apply this
 * dump-all gate while `cjm≠off` (false positive when frames advance fast).
 */

import { latchPoSignal } from "@/app/shell/agent-testing/agentTestingPoSignal";
import { playbackDiagLog } from "@/app/shell/playbackDiag";
import { STUDIO_CONTENT_LOAD_MS } from "@/uxds/motion";
import { getChatScenarioRevealState } from "@/projects/boots-pharmacy/screens/chat/chatScenarioRevealBridge";

const POLL_MS = 120;
/** Instant dump = full thread before platform content-load interim. */
const BATCH_FAIL_MS = Math.min(500, STUDIO_CONTENT_LOAD_MS / 3);

type WatchMemory = {
  timer: ReturnType<typeof setInterval> | null;
  armedAt: number;
  maxVisible: number;
  fired: boolean;
  onFail?: (detail: string) => void;
};

const MEM = "__studioQaChatLoadingWatch";

function emptyWatch(): WatchMemory {
  return {
    timer: null,
    armedAt: 0,
    maxVisible: 0,
    fired: false,
  };
}

function memory(): WatchMemory {
  // Node/Vitest has no window — use globalThis so forceClear cannot throw mid-wipe.
  if (typeof window === "undefined") {
    const g = globalThis as typeof globalThis & { [MEM]?: WatchMemory };
    if (!g[MEM]) g[MEM] = emptyWatch();
    return g[MEM]!;
  }
  const w = window as Window & { [MEM]?: WatchMemory };
  if (!w[MEM]) w[MEM] = emptyWatch();
  return w[MEM]!;
}

/**
 * Dump-all watch applies only to CJM-off saved-chat load.
 * CJM-on progressive Play/SF must not be gated by content-load interim.
 */
export function isQaChatLoadingDumpWatchApplicable(
  search: string = typeof location !== "undefined" ? location.search : ""
): boolean {
  try {
    const q = search.startsWith("?") ? search.slice(1) : search;
    return new URLSearchParams(q).get("cjm") === "off";
  } catch {
    return false;
  }
}

/**
 * Start watching chat loading while QA is open (CJM-off only).
 * Batch jump to ≥4 frames before content-load interim = FAIL.
 * No-ops when CJM-on — progressive reveal is expected.
 */
export function armQaChatLoadingWatch(options?: {
  onFail?: (detail: string) => void;
}): void {
  if (!isQaChatLoadingDumpWatchApplicable()) {
    disarmQaChatLoadingWatch();
    return;
  }
  const m = memory();
  m.onFail = options?.onFail;
  m.armedAt = performance.now();
  m.maxVisible = getChatScenarioRevealState().visibleCount;
  m.fired = false;
  if (m.timer != null) return;
  m.timer = setInterval(() => {
    tickWatch();
  }, POLL_MS);
}

export function disarmQaChatLoadingWatch(): void {
  const m = memory();
  if (m.timer != null) {
    clearInterval(m.timer);
    m.timer = null;
  }
  m.fired = false;
  m.armedAt = 0;
}

function tickWatch(): void {
  const m = memory();
  if (m.fired || m.armedAt <= 0) return;
  // Re-check URL each tick — CJM toggle / Play must not false-positive.
  if (!isQaChatLoadingDumpWatchApplicable()) return;

  const st = getChatScenarioRevealState();
  if (st.visibleCount > m.maxVisible) m.maxVisible = st.visibleCount;

  const elapsed = performance.now() - m.armedAt;
  // Dump-all: ≥4 frames before content-load interim completes.
  if (elapsed <= BATCH_FAIL_MS && st.visibleCount >= 4) {
    m.fired = true;
    const detail = `CHAT_LOADING_DUMP_ALL — visible=${st.visibleCount} in ${Math.round(elapsed)}ms (need ${STUDIO_CONTENT_LOAD_MS}ms content-load interim)`;
    try {
      playbackDiagLog("error", detail);
    } catch {
      /* hang-safe */
    }
    try {
      latchPoSignal({
        type: "alarm",
        code: "CHAT_LOADING_DUMP_ALL",
        note: detail,
      });
    } catch {
      /* hang-safe */
    }
    try {
      m.onFail?.(detail);
    } catch {
      /* hang-safe */
    }
  }
}

/** Test seam — run one watch poll without waiting on the interval. */
export function tickQaChatLoadingWatchForTests(): void {
  tickWatch();
}

export function resetQaChatLoadingWatchForTests(): void {
  disarmQaChatLoadingWatch();
  const m = memory();
  m.maxVisible = 0;
  m.fired = false;
}
