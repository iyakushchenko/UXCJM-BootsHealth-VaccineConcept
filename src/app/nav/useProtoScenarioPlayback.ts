import { useCallback, useEffect, useLayoutEffect, useRef, useState, type RefObject } from "react";
import {
  applyScenarioFrameVisibility,
  PROTO_SCENARIO_MIN_VISIBLE_FRAMES,
  scheduleScenarioScroll,
  scenarioScrollTiming,
  scenarioScrollTopBeforeCollapse,
  scrollPrototypeScrollToTop,
  type ScenarioScrollAlign,
  type ScenarioScrollTiming,
} from "@/app/proto/protoScenarioEngine";

type Options = {
  active: boolean;
  collectFrames: () => HTMLElement[];
  screenSelector?: string;
  scrollRootRef?: RefObject<HTMLElement | null>;
  minVisibleFrames?: number;
  playbackStepMs?: number;
  playbackStepHooks?: PlaybackStepHooks;
};

export type PlaybackStepHooks = {
  /** Async prelude before a frame is revealed (thinking, typing, CTA clicks). */
  beforeReveal?: (ctx: BeforeRevealContext) => Promise<void>;
  /** @deprecated Use beforeReveal */
  shouldPauseBeforeReveal?: (frame: HTMLElement, frameIndex: number) => boolean;
  pauseBeforeRevealMs?: number;
  onPauseBeforeRevealStart?: (frame: HTMLElement, frameIndex: number) => void;
  onPauseBeforeRevealEnd?: () => void;
  onPreludeAbort?: () => void;
};

export type BeforeRevealContext = {
  frame: HTMLElement;
  frameIndex: number;
  frames: HTMLElement[];
  currentCount: number;
};

type PlaybackMode = "idle" | "playing";

type ScrollIntent = {
  visibleCount: number;
  prevCount: number;
  align: ScenarioScrollAlign;
  smooth: boolean;
  timing: ScenarioScrollTiming;
};

function clearScenarioFrameStyles(frames: HTMLElement[]): void {
  frames.forEach((frame) => {
    const id = frame.dataset.protoScenarioHideTid;
    if (id) window.clearTimeout(Number(id));
    frame.style.display = "";
    delete frame.dataset.protoScenarioVisible;
    delete frame.dataset.protoScenarioFrame;
    delete frame.dataset.protoScenarioHideTid;
    frame.classList.remove("proto-scenario-frame", "proto-scenario-frame--hidden");
  });
}

function clampVisible(
  count: number,
  total: number,
  minVisible: number
): number {
  if (total === 0) return 0;
  return Math.max(minVisible, Math.min(count, total));
}

function scrollAlignForCount(count: number, minVisible: number): ScenarioScrollAlign {
  return count <= minVisible ? "start" : "end";
}

export function useProtoScenarioPlayback({
  active,
  collectFrames,
  screenSelector,
  scrollRootRef,
  minVisibleFrames = PROTO_SCENARIO_MIN_VISIBLE_FRAMES,
  playbackStepMs = 2000,
  playbackStepHooks,
}: Options) {
  const framesRef = useRef<HTMLElement[]>([]);
  const playTimerRef = useRef<number | null>(null);
  const pauseCleanupRef = useRef<(() => void) | null>(null);
  const isPlayingRef = useRef(false);
  const initializedRef = useRef(false);
  const initialScrollDoneRef = useRef(false);
  const visibleCountRef = useRef(0);
  const scrollIntentRef = useRef<ScrollIntent | null>(null);

  const [totalFrames, setTotalFrames] = useState(0);
  const [visibleCount, setVisibleCount] = useState(0);
  const [playbackMode, setPlaybackMode] = useState<PlaybackMode>("idle");
  const [isPausingBeforeReveal, setIsPausingBeforeReveal] = useState(false);

  const isPlaying = playbackMode === "playing";
  const controlsLocked = isPlaying || isPausingBeforeReveal;

  const queueScroll = useCallback(
    (
      count: number,
      align?: ScenarioScrollAlign,
      smooth = true,
      prevCount = visibleCountRef.current
    ) => {
      const resolvedAlign = align ?? scrollAlignForCount(count, minVisibleFrames);
      scrollIntentRef.current = {
        visibleCount: count,
        prevCount,
        align: resolvedAlign,
        smooth,
        timing: scenarioScrollTiming(prevCount, count),
      };
    },
    [minVisibleFrames]
  );

  const clearPreRevealPause = useCallback(() => {
    if (playTimerRef.current != null) {
      window.clearTimeout(playTimerRef.current);
      playTimerRef.current = null;
    }
    if (pauseCleanupRef.current) {
      pauseCleanupRef.current();
      pauseCleanupRef.current = null;
    }
    playbackStepHooks?.onPreludeAbort?.();
    setIsPausingBeforeReveal(false);
  }, [playbackStepHooks]);

  const stopPlayback = useCallback(() => {
    clearPreRevealPause();
    isPlayingRef.current = false;
    setPlaybackMode("idle");
  }, [clearPreRevealPause]);

  const syncFrames = useCallback(() => {
    const frames = collectFrames();
    framesRef.current = frames;
    frames.forEach((frame, index) => {
      frame.dataset.protoScenarioFrame = String(index + 1);
    });
    setTotalFrames(frames.length);

    if (!initializedRef.current && frames.length > 0) {
      initializedRef.current = true;
      visibleCountRef.current = frames.length;
      scrollIntentRef.current = {
        visibleCount: frames.length,
        prevCount: 0,
        align: "end",
        smooth: true,
        timing: "after-init",
      };
      setVisibleCount(frames.length);
    } else if (frames.length > 0) {
      setVisibleCount((prev) => {
        // RAF re-sync can run before the init setState lands — never collapse to min on that frame.
        if (prev === 0) return frames.length;
        return clampVisible(prev, frames.length, minVisibleFrames);
      });
    }

    return frames;
  }, [collectFrames, minVisibleFrames]);

  const refreshFrameList = useCallback(() => {
    const frames = collectFrames();
    if (frames.length === 0) return frames;
    framesRef.current = frames;
    frames.forEach((frame, index) => {
      frame.dataset.protoScenarioFrame = String(index + 1);
    });
    setTotalFrames(frames.length);
    const count = visibleCountRef.current || frames.length;
    applyScenarioFrameVisibility(frames, count);
    return frames;
  }, [collectFrames]);

  useLayoutEffect(() => {
    visibleCountRef.current = visibleCount;
  }, [visibleCount]);

  useLayoutEffect(() => {
    if (!active) {
      stopPlayback();
      clearScenarioFrameStyles(framesRef.current);
      framesRef.current = [];
      initializedRef.current = false;
      initialScrollDoneRef.current = false;
      scrollIntentRef.current = null;
      setTotalFrames(0);
      setVisibleCount(0);
      return;
    }

    syncFrames();
    const raf = requestAnimationFrame(() => refreshFrameList());
    return () => cancelAnimationFrame(raf);
  }, [active, refreshFrameList, syncFrames, stopPlayback]);

  useLayoutEffect(() => {
    if (!active) return;

    const frames = framesRef.current;
    if (frames.length === 0) return;

    const pendingInit = scrollIntentRef.current?.visibleCount ?? 0;
    const effectiveCount =
      visibleCount > 0 ? visibleCount : pendingInit > 0 ? pendingInit : 0;
    if (effectiveCount === 0) return;

    const intent = scrollIntentRef.current;
    if (
      intent &&
      intent.visibleCount === effectiveCount &&
      scenarioScrollTopBeforeCollapse(
        intent.prevCount,
        intent.visibleCount,
        intent.align,
        minVisibleFrames
      )
    ) {
      scrollPrototypeScrollToTop(scrollRootRef?.current, "instant");
    }

    applyScenarioFrameVisibility(frames, effectiveCount);

    if (intent && intent.visibleCount === effectiveCount) {
      if (intent.timing === "after-init" && initialScrollDoneRef.current) {
        scrollIntentRef.current = null;
        return;
      }

      scheduleScenarioScroll(
        frames,
        intent.visibleCount,
        intent.align,
        scrollRootRef?.current,
        intent.smooth,
        intent.timing,
        intent.prevCount
      );
      scrollIntentRef.current = null;

      if (intent.timing === "after-init") {
        initialScrollDoneRef.current = true;
      }
    }
  }, [active, minVisibleFrames, scrollRootRef, visibleCount]);

  useEffect(() => () => stopPlayback(), [stopPlayback]);

  const advanceOneFrame = useCallback(
    (onRevealed?: () => void): boolean => {
      const frames = framesRef.current;
      const current = visibleCountRef.current;
      if (current >= frames.length || playTimerRef.current != null) return false;

      const next = clampVisible(current + 1, frames.length, minVisibleFrames);
      const frame = frames[next - 1];
      const fromCount = current;

      const revealFrame = () => {
        if (visibleCountRef.current !== fromCount) return;

        setIsPausingBeforeReveal(false);
        queueScroll(next, "end", false, fromCount);
        setVisibleCount(next);

        if (next >= frames.length) {
          stopPlayback();
          return;
        }

        onRevealed?.();
      };

      const runPrelude = async () => {
        const hasBeforeReveal = Boolean(playbackStepHooks?.beforeReveal);
        const legacyPause =
          !hasBeforeReveal &&
          (playbackStepHooks?.shouldPauseBeforeReveal?.(frame, next) ?? false);

        if (!hasBeforeReveal && !legacyPause) {
          revealFrame();
          return;
        }

        setIsPausingBeforeReveal(true);
        pauseCleanupRef.current = () => {
          playbackStepHooks?.onPreludeAbort?.();
          setIsPausingBeforeReveal(false);
        };

        try {
          if (hasBeforeReveal) {
            await playbackStepHooks!.beforeReveal!({
              frame,
              frameIndex: next,
              frames,
              currentCount: fromCount,
            });
          } else {
            playbackStepHooks?.onPauseBeforeRevealStart?.(frame, next);
            await new Promise<void>((resolve) => {
              playTimerRef.current = window.setTimeout(() => {
                playTimerRef.current = null;
                resolve();
              }, playbackStepHooks?.pauseBeforeRevealMs ?? 1400);
            });
            playbackStepHooks?.onPauseBeforeRevealEnd?.();
          }
        } finally {
          pauseCleanupRef.current = null;
        }

        if (visibleCountRef.current !== fromCount) return;
        revealFrame();
      };

      playTimerRef.current = window.setTimeout(() => {
        playTimerRef.current = null;
        void runPrelude();
      }, 0);

      return true;
    },
    [minVisibleFrames, playbackStepHooks, queueScroll, stopPlayback]
  );

  const stepBack = useCallback(() => {
    stopPlayback();
    setVisibleCount((count) => {
      const next = clampVisible(count - 1, framesRef.current.length, minVisibleFrames);
      const align = scrollAlignForCount(next, minVisibleFrames);
      queueScroll(next, align, false, count);
      return next;
    });
  }, [minVisibleFrames, queueScroll, stopPlayback]);

  const stepForward = useCallback(() => {
    stopPlayback();
    advanceOneFrame();
  }, [advanceOneFrame, stopPlayback]);

  const play = useCallback(() => {
    if (isPlayingRef.current) {
      stopPlayback();
      return;
    }

    const frames = framesRef.current;
    if (frames.length === 0 || playTimerRef.current != null) return;

    if (visibleCountRef.current >= frames.length) return;

    isPlayingRef.current = true;
    setPlaybackMode("playing");

    const scheduleNext = () => {
      if (!isPlayingRef.current) return;
      playTimerRef.current = window.setTimeout(() => {
        playTimerRef.current = null;
        if (!advanceOneFrame(scheduleNext)) {
          stopPlayback();
        }
      }, playbackStepMs);
    };

    if (!advanceOneFrame(scheduleNext)) {
      stopPlayback();
    }
  }, [advanceOneFrame, playbackStepMs, stopPlayback]);

  const jumpToStart = useCallback(() => {
    stopPlayback();
    if (framesRef.current.length > 0 && visibleCountRef.current > minVisibleFrames) {
      const prev = visibleCountRef.current;
      queueScroll(minVisibleFrames, "start", false, prev);
      setVisibleCount(minVisibleFrames);
      return;
    }
    scheduleScenarioScroll(
      framesRef.current,
      minVisibleFrames,
      "start",
      scrollRootRef?.current,
      false,
      "immediate",
      visibleCountRef.current
    );
  }, [minVisibleFrames, queueScroll, scrollRootRef, stopPlayback]);

  const jumpToEnd = useCallback(() => {
    stopPlayback();
    const total = framesRef.current.length;
    if (total === 0 || visibleCountRef.current >= total) return;

    const prev = visibleCountRef.current;
    queueScroll(total, "end", false, prev);
    setVisibleCount(total);
  }, [queueScroll, stopPlayback]);

  const resetToEnd = useCallback(() => {
    jumpToEnd();
  }, [jumpToEnd]);

  const isDirty = active && totalFrames > 0 && visibleCount !== totalFrames;

  return {
    totalFrames,
    visibleCount,
    isPlaying,
    isPausingBeforeReveal,
    isDirty,
    canStepBack: visibleCount > minVisibleFrames && !isPlaying,
    canStepForward: visibleCount < totalFrames && !controlsLocked,
    canJumpToStart: visibleCount > minVisibleFrames && !controlsLocked,
    canPlay: visibleCount < totalFrames && !isPausingBeforeReveal,
    canJumpToEnd: visibleCount < totalFrames && !controlsLocked,
    stepBack,
    stepForward,
    play,
    jumpToStart,
    jumpToEnd,
    resetToEnd,
    cancelPreRevealPause: clearPreRevealPause,
  };
}
