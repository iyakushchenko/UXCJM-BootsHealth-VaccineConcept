import {
  detectScrollExcessiveBurst,
  detectScrollIntraScriptStack,
  detectScrollJump,
  detectScrollPathDeviation,
  detectScrollReversals,
  detectScrollStutter,
  SCROLL_BURST_POST_SCRIPT_MS,
  type ScrollAnomaly,
  type ScrollSample,
} from "@/app/shell/playbackScrollAnomalies";
import { playbackDiagScroll } from "@/app/shell/playbackDiag";
import { isFastPlayback } from "@/app/shell/playbackTiming";
import { isChatPullUpScrollLocked } from "@/projects/boots-pharmacy/screens/chat/chatMotion";

/** Tab / screen changes — eased camera mid-flight must not FAIL path deviation. */
const NAVIGATION_SCROLL_GRACE_MS = 1200;
const RETREAT_SYNC_SCROLL_GRACE_MS = 900;

export type ScrollAnimationTelemetry = {
  id: number;
  startTop: number;
  targetTop: number;
  duration: number;
  startTime: number;
  lastFrameTime: number;
  stutterFrames: number;
  /** Dynamic chat co-travel re-anchors its start/target as reply geometry grows. */
  pathCheck: boolean;
};

export type PlaybackScrollMonitor = {
  setActive: (active: boolean) => void;
  setOnAnomaly: (handler: ((anomaly: ScrollAnomaly) => void) | null) => void;
  reset: () => void;
  onAnimationStart: (payload: {
    startTop: number;
    targetTop: number;
    duration: number;
    pathCheck?: boolean;
  }) => void;
  onAnimationFrame: (payload: { scrollTop: number; frameMs: number }) => void;
  onAnimationEnd: (payload: {
    completed: boolean;
    finalTop: number;
    replaced?: boolean;
  }) => void;
  onAnimationCancelled: () => void;
  onPassiveScroll: (scrollTop: number) => void;
  onPinApply: (scrollTop: number) => void;
  noteScreenChange: () => void;
  noteRetreatSync: () => void;
  noteDirectorScriptStart: (options?: { scriptLabel?: string }) => void;
  noteDirectorScriptEnd: (options?: { scriptLabel?: string }) => void;
  isBurstWatchActive: () => boolean;
  noteScrollPosition: (scrollTop: number) => void;
};

export function createPlaybackScrollMonitor(): PlaybackScrollMonitor {
  let active = false;
  let onAnomaly: ((anomaly: ScrollAnomaly) => void) | null = null;
  let reported = false;
  let animationId = 0;
  let animation: ScrollAnimationTelemetry | null = null;
  let samples: ScrollSample[] = [];
  let lastScrollTop: number | null = null;
  let pinActive = false;
  let navigationGraceUntil = 0;
  let retreatGraceUntil = 0;
  let burstWatchUntil = 0;
  let burstScriptLabel: string | undefined;
  let burstAnimationStarts = 0;
  let burstTravelPx = 0;
  let burstLastScrollTop: number | null = null;
  let burstFinalizeTimer: ReturnType<typeof setTimeout> | null = null;
  let inScriptWatch = false;
  let inScriptLabel: string | undefined;
  let inScriptAnimationStarts = 0;

  const inNavigationGrace = () => performance.now() < navigationGraceUntil;
  const inRetreatGrace = () => performance.now() < retreatGraceUntil;
  const inPassiveScrollGrace = () => inNavigationGrace() || inRetreatGrace();
  const inBurstWatch = () => performance.now() < burstWatchUntil;

  const clearBurstFinalizeTimer = () => {
    if (burstFinalizeTimer != null) {
      clearTimeout(burstFinalizeTimer);
      burstFinalizeTimer = null;
    }
  };

  const clearBurstWatch = () => {
    burstWatchUntil = 0;
    burstScriptLabel = undefined;
    burstAnimationStarts = 0;
    burstTravelPx = 0;
    burstLastScrollTop = null;
    clearBurstFinalizeTimer();
  };

  const accumulateBurstTravel = (scrollTop: number) => {
    if (!inBurstWatch()) return;
    if (burstLastScrollTop != null) {
      burstTravelPx += Math.abs(scrollTop - burstLastScrollTop);
    }
    burstLastScrollTop = scrollTop;
  };

  const evaluateBurstWatch = (finalize = false) => {
    if (!inBurstWatch() && !finalize) return;
    const anomaly = detectScrollExcessiveBurst({
      scriptLabel: burstScriptLabel,
      animationStarts: burstAnimationStarts,
      travelPx: burstTravelPx,
      windowMs: SCROLL_BURST_POST_SCRIPT_MS,
    });
    if (anomaly) {
      report(anomaly);
      clearBurstWatch();
      return;
    }
    if (finalize) clearBurstWatch();
  };

  const scheduleBurstFinalize = () => {
    clearBurstFinalizeTimer();
    const remaining = Math.max(0, burstWatchUntil - performance.now());
    burstFinalizeTimer = setTimeout(() => {
      burstFinalizeTimer = null;
      evaluateBurstWatch(true);
    }, remaining + 16);
  };

  const report = (anomaly: ScrollAnomaly) => {
    if (!active || reported || !onAnomaly) return;
    // Fast QA suite contract: motion-frame samples stay diagnostic-only.
    // Compressed rAF under playbackMs() can land tens of px off the ease model
    // without a functional miss — never open a blocking FAIL/Alarm (LESSONS /
    // all-cjms-fast description). Route/modal/counter guards stay strict.
    if (
      isFastPlayback() &&
      (anomaly.kind === "scroll-path-deviation" || anomaly.kind === "scroll-stutter")
    ) {
      try {
        playbackDiagScroll({
          detail: `fast-diag-only · ${anomaly.kind}: ${anomaly.message}${
            anomaly.detail ? ` · ${anomaly.detail}` : ""
          }`,
        });
      } catch {
        /* hang-safe */
      }
      return;
    }
    reported = true;
    onAnomaly(anomaly);
  };

  const pushSample = (top: number) => {
    if (inPassiveScrollGrace()) return;
    const t = performance.now();
    samples.push({ t, top });
    if (samples.length > 120) samples.shift();
    const reversal = detectScrollReversals(samples, t);
    if (reversal) report(reversal);
  };

  return {
    setActive(next) {
      active = next;
      if (!next) {
        animation = null;
        pinActive = false;
      }
    },
    setOnAnomaly(handler) {
      onAnomaly = handler;
    },
    reset() {
      reported = false;
      animation = null;
      samples = [];
      lastScrollTop = null;
      pinActive = false;
      navigationGraceUntil = 0;
      retreatGraceUntil = 0;
      inScriptWatch = false;
      inScriptLabel = undefined;
      inScriptAnimationStarts = 0;
      if (!inBurstWatch()) {
        clearBurstWatch();
      }
    },
    noteScreenChange() {
      navigationGraceUntil = performance.now() + NAVIGATION_SCROLL_GRACE_MS;
      samples = [];
      lastScrollTop = null;
      pinActive = false;
      // Drop in-flight animation telemetry — layout/host just changed.
      animation = null;
      clearBurstWatch();
    },
    noteRetreatSync() {
      retreatGraceUntil = performance.now() + RETREAT_SYNC_SCROLL_GRACE_MS;
      samples = [];
      clearBurstWatch();
    },
    noteDirectorScriptStart(options) {
      if (!active || !options?.scriptLabel) return;
      clearBurstWatch();
      inScriptWatch = true;
      inScriptLabel = options.scriptLabel;
      inScriptAnimationStarts = 0;
    },
    noteDirectorScriptEnd(options) {
      if (!active || !options?.scriptLabel) return;
      inScriptWatch = false;
      inScriptLabel = undefined;
      inScriptAnimationStarts = 0;
      clearBurstWatch();
      burstScriptLabel = options.scriptLabel;
      burstWatchUntil = performance.now() + SCROLL_BURST_POST_SCRIPT_MS;
      burstAnimationStarts = 0;
      burstTravelPx = 0;
      burstLastScrollTop = lastScrollTop;
      scheduleBurstFinalize();
    },
    isBurstWatchActive() {
      return inBurstWatch();
    },
    onAnimationStart({ startTop, targetTop, duration, pathCheck = true }) {
      if (!active) return;
      if (inScriptWatch) {
        inScriptAnimationStarts += 1;
        const intra = detectScrollIntraScriptStack({
          scriptLabel: inScriptLabel,
          animationStarts: inScriptAnimationStarts,
        });
        if (intra) report(intra);
      }
      if (inBurstWatch()) {
        burstAnimationStarts += 1;
        accumulateBurstTravel(startTop);
        evaluateBurstWatch();
      }
      animation = null;
      animationId += 1;
      const now = performance.now();
      animation = {
        id: animationId,
        startTop,
        targetTop,
        duration,
        startTime: now,
        lastFrameTime: now,
        stutterFrames: 0,
        pathCheck,
      };
      lastScrollTop = startTop;
      pushSample(startTop);
    },
    onAnimationFrame({ scrollTop, frameMs }) {
      // Local ref — onAnomaly (diagnostic/halt) may null `animation` mid-frame.
      const anim = animation;
      if (!active || !anim) return;
      if (frameMs > 0) {
        if (frameMs >= 50) {
          anim.stutterFrames += 1;
          const stutter = detectScrollStutter(anim.stutterFrames);
          if (stutter) report(stutter);
        } else {
          anim.stutterFrames = 0;
        }
      }

      const now = performance.now();
      // Suppress during director scripts AND screen/retreat grace (confirmation→history
      // click scroll must not FAIL when the host swaps mid-ease).
      // Also suppress while chat bubble pull-up holds scrollLock — PO co-travel
      // (pull-up + host-end) intentionally diverges from a single eased path.
      if (
        !inScriptWatch &&
        !inPassiveScrollGrace() &&
        animation === anim &&
        anim.pathCheck &&
        !isChatPullUpScrollLocked()
      ) {
        const deviation = detectScrollPathDeviation({
          startTop: anim.startTop,
          targetTop: anim.targetTop,
          duration: anim.duration,
          startTime: anim.startTime,
          actualTop: scrollTop,
          now,
        });
        if (deviation) report(deviation);
      }

      // Halt/diagnostic may have cleared animation via report() side effects.
      if (animation !== anim) return;
      anim.lastFrameTime = now;
      lastScrollTop = scrollTop;
      accumulateBurstTravel(scrollTop);
      pushSample(scrollTop);
    },
    onAnimationEnd({ completed, finalTop, replaced }) {
      if (!active) return;
      if (inBurstWatch()) {
        accumulateBurstTravel(finalTop);
        evaluateBurstWatch();
      }
      if (animation && !completed && !replaced && !inPassiveScrollGrace()) {
        report({
          kind: "scroll-interrupted",
          message: "Eased scroll animation was cancelled before completion",
          detail: `target=${Math.round(animation.targetTop)} final=${Math.round(finalTop)}`,
        });
      }
      animation = null;
      lastScrollTop = finalTop;
      pushSample(finalTop);
    },
    onAnimationCancelled() {
      if (!active || !animation) return;
      if (inPassiveScrollGrace()) {
        animation = null;
        return;
      }
      report({
        kind: "scroll-interrupted",
        message: "Eased scroll animation cancelled (competing scroll or transport interrupt)",
        detail: `target=${Math.round(animation.targetTop)}`,
      });
      animation = null;
    },
    onPassiveScroll(scrollTop) {
      if (!active) return;
      if (inPassiveScrollGrace()) {
        lastScrollTop = scrollTop;
        return;
      }
      if (animation || pinActive) return;
      if (inBurstWatch()) {
        accumulateBurstTravel(scrollTop);
        evaluateBurstWatch();
      }
      if (lastScrollTop != null) {
        const frameMs = 16;
        const jump = detectScrollJump(lastScrollTop, scrollTop, frameMs);
        if (jump) report(jump);
      }
      lastScrollTop = scrollTop;
      pushSample(scrollTop);
    },
    onPinApply(scrollTop) {
      if (!active) return;
      pinActive = true;
      lastScrollTop = scrollTop;
      pushSample(scrollTop);
      window.setTimeout(() => {
        pinActive = false;
      }, 120);
    },
    noteScrollPosition(scrollTop) {
      if (!active) return;
      lastScrollTop = scrollTop;
    },
  };
}

export const playbackScrollMonitor = createPlaybackScrollMonitor();
