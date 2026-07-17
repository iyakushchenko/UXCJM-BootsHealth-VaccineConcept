import { useCallback, useEffect, useLayoutEffect, useRef, useState, type RefObject } from "react";
import {
  applyScenarioFrameVisibility,
  PROTO_SCENARIO_MIN_VISIBLE_FRAMES,
  scrollPrototypeScrollToBottomOnce,
  scrollPrototypeScrollToTopAfterLayout,
  scrollScenarioChatAnchor,
  type ScenarioScrollAlign,
} from "@/app/proto/protoScenarioEngine";

type Options = {
  active: boolean;
  collectFrames: () => HTMLElement[];
  screenSelector?: string;
  scrollRootRef?: RefObject<HTMLElement | null>;
  minVisibleFrames?: number;
  playbackStepMs?: number;
};

type PlaybackMode = "idle" | "playing";

type ScrollIntent = {
  visibleCount: number;
  align: ScenarioScrollAlign;
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
}: Options) {
  const framesRef = useRef<HTMLElement[]>([]);
  const playTimerRef = useRef<number | null>(null);
  const isPlayingRef = useRef(false);
  const initializedRef = useRef(false);
  const initialScrollDoneRef = useRef(false);
  const visibleCountRef = useRef(0);
  const scrollIntentRef = useRef<ScrollIntent | null>(null);

  const [totalFrames, setTotalFrames] = useState(0);
  const [visibleCount, setVisibleCount] = useState(0);
  const [playbackMode, setPlaybackMode] = useState<PlaybackMode>("idle");

  const isPlaying = playbackMode === "playing";

  const queueScroll = useCallback(
    (count: number, align?: ScenarioScrollAlign) => {
      scrollIntentRef.current = {
        visibleCount: count,
        align: align ?? scrollAlignForCount(count, minVisibleFrames),
      };
    },
    [minVisibleFrames]
  );

  const stopPlayback = useCallback(() => {
    if (playTimerRef.current != null) {
      window.clearInterval(playTimerRef.current);
      playTimerRef.current = null;
    }
    isPlayingRef.current = false;
    setPlaybackMode("idle");
  }, []);

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
        align: "end",
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

    applyScenarioFrameVisibility(frames, effectiveCount);

    const intent = scrollIntentRef.current;
    if (intent && intent.visibleCount === effectiveCount) {
      scrollScenarioChatAnchor(
        frames,
        intent.visibleCount,
        intent.align,
        scrollRootRef?.current
      );
      scrollIntentRef.current = null;

      if (
        !initialScrollDoneRef.current &&
        intent.align === "end" &&
        intent.visibleCount === frames.length
      ) {
        initialScrollDoneRef.current = true;
        scrollPrototypeScrollToBottomOnce(scrollRootRef?.current);
      }
    }
  }, [active, minVisibleFrames, scrollRootRef, visibleCount]);

  useEffect(() => () => stopPlayback(), [stopPlayback]);

  const stepBack = useCallback(() => {
    stopPlayback();
    setVisibleCount((count) => {
      const next = clampVisible(count - 1, framesRef.current.length, minVisibleFrames);
      queueScroll(next);
      return next;
    });
  }, [minVisibleFrames, queueScroll, stopPlayback]);

  const stepForward = useCallback(() => {
    stopPlayback();
    setVisibleCount((count) => {
      const next = clampVisible(count + 1, framesRef.current.length, minVisibleFrames);
      queueScroll(next);
      return next;
    });
  }, [minVisibleFrames, queueScroll, stopPlayback]);

  const play = useCallback(() => {
    if (isPlayingRef.current) {
      stopPlayback();
      return;
    }

    const frames = framesRef.current;
    if (frames.length === 0 || playTimerRef.current != null) return;

    const start = visibleCountRef.current;
    if (start >= frames.length) return;

    isPlayingRef.current = true;
    setPlaybackMode("playing");

    playTimerRef.current = window.setInterval(() => {
      const current = visibleCountRef.current;
      if (current >= frames.length) {
        stopPlayback();
        return;
      }

      const next = clampVisible(current + 1, frames.length, minVisibleFrames);
      queueScroll(next);
      setVisibleCount(next);

      if (next >= frames.length) {
        stopPlayback();
      }
    }, playbackStepMs);
  }, [minVisibleFrames, playbackStepMs, queueScroll, stopPlayback]);

  const jumpToStart = useCallback(() => {
    stopPlayback();
    if (framesRef.current.length > 0 && visibleCountRef.current > minVisibleFrames) {
      queueScroll(minVisibleFrames, "start");
      setVisibleCount(minVisibleFrames);
    }
    scrollPrototypeScrollToTopAfterLayout(scrollRootRef?.current);
  }, [minVisibleFrames, queueScroll, scrollRootRef, stopPlayback]);

  const jumpToEnd = useCallback(() => {
    stopPlayback();
    const total = framesRef.current.length;
    if (total === 0 || visibleCountRef.current >= total) return;

    queueScroll(total, "end");
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
    isDirty,
    canStepBack: visibleCount > minVisibleFrames && !isPlaying,
    canStepForward: visibleCount < totalFrames && !isPlaying,
    canJumpToStart: visibleCount > minVisibleFrames && !isPlaying,
    canPlay: visibleCount < totalFrames,
    canJumpToEnd: visibleCount < totalFrames && !isPlaying,
    stepBack,
    stepForward,
    play,
    jumpToStart,
    jumpToEnd,
    resetToEnd,
  };
}
