import { useEffect, useLayoutEffect, useRef, type RefObject } from "react";

import type { JourneyBeat } from "@/app/orchestra/types";

import {
  beatDirectorScriptLabel,
  directorScriptScrollsViewport,
} from "@/app/orchestra/journeyBeatDirector";

import { getPrototypeScrollRoot } from "@/app/scenario/playbackScroll";

import type { ScrollAnomaly } from "@/app/shell/playbackScrollAnomalies";

import { shouldReportPassiveScrollAnomaly } from "@/app/shell/playbackScrollAnomalies";

import {
  playbackScrollMonitor,
  type PlaybackScrollMonitor,
} from "@/app/shell/playbackScrollMonitor";

import {
  playbackScrollStutterDiagnostic,
  type PlaybackDiagnosticError,
} from "@/app/shell/playbackDiagnostic";

type Snapshot = {
  isOnAir: boolean;
  isScripting?: boolean;
  isPausingBeforeReveal: boolean;
  journeyMode?: boolean;
  journeyAtEnd?: boolean;
  availabilityOpen?: boolean;
  childIndex?: number | null;
  protoTab?: number | null;
  journeyId?: string;
  beatId?: string;
  beatLabel?: string;
  touchpointLabel?: string;
  visibleProgress?: string;
};

type Options = {
  snapshot: Snapshot;
  currentBeat?: JourneyBeat;
  scrollRootRef: RefObject<HTMLElement | null>;
  onDiagnostic: (error: PlaybackDiagnosticError) => void;
  monitor?: PlaybackScrollMonitor;
};

export function usePlaybackScrollGuard({
  snapshot,
  currentBeat,
  scrollRootRef,
  onDiagnostic,
  monitor = playbackScrollMonitor,
}: Options): void {
  const onDiagnosticRef = useRef(onDiagnostic);
  onDiagnosticRef.current = onDiagnostic;

  const snapshotRef = useRef(snapshot);
  snapshotRef.current = snapshot;

  const currentBeatRef = useRef(currentBeat);
  currentBeatRef.current = currentBeat;

  const prevPausingRef = useRef(false);
  const prevScriptingRef = useRef(false);
  const manualScriptLabelRef = useRef<string | undefined>(undefined);
  const activeScriptLabelRef = useRef<string | undefined>(undefined);

  const scrollGuardActive =
    snapshot.isOnAir ||
    snapshot.isPausingBeforeReveal ||
    Boolean(snapshot.journeyMode);

  useEffect(() => {
    const report = (anomaly: ScrollAnomaly) => {
      const snap = snapshotRef.current;
      const beat = currentBeatRef.current;
      onDiagnosticRef.current(
        playbackScrollStutterDiagnostic({
          journeyId: snap.journeyId,
          beatId: snap.beatId ?? beat?.id,
          beatLabel: snap.beatLabel ?? beat?.label,
          anomaly,
          touchpoint: snap.touchpointLabel,
          visibleProgress: snap.visibleProgress,
        })
      );
    };

    monitor.setOnAnomaly(report);
    return () => monitor.setOnAnomaly(null);
  }, [monitor]);

  const prevChildIndexRef = useRef<number | null>(null);
  const prevProtoTabRef = useRef<number | null>(null);
  const prevAvailabilityOpenRef = useRef(false);

  useLayoutEffect(() => {
    const pausing = snapshot.isPausingBeforeReveal;

    if (pausing && !prevPausingRef.current) {
      activeScriptLabelRef.current = beatDirectorScriptLabel(
        currentBeatRef.current
      );
      const scriptLabel = activeScriptLabelRef.current;
      if (scriptLabel && directorScriptScrollsViewport(scriptLabel)) {
        monitor.noteDirectorScriptStart({ scriptLabel });
      }
    }

    if (prevPausingRef.current && !pausing) {
      const scriptLabel = activeScriptLabelRef.current;
      activeScriptLabelRef.current = undefined;
      if (scriptLabel && directorScriptScrollsViewport(scriptLabel)) {
        monitor.noteDirectorScriptEnd({ scriptLabel });
      }
    }

    prevPausingRef.current = pausing;
  }, [monitor, snapshot.isPausingBeforeReveal]);

  useLayoutEffect(() => {
    const scripting = Boolean(snapshot.isScripting);
    const scriptLabel = beatDirectorScriptLabel(currentBeatRef.current);

    if (scripting && !prevScriptingRef.current) {
      if (scriptLabel && directorScriptScrollsViewport(scriptLabel)) {
        manualScriptLabelRef.current = scriptLabel;
        monitor.noteDirectorScriptStart({ scriptLabel });
      }
    }
    if (!scripting && prevScriptingRef.current) {
      const endedLabel = manualScriptLabelRef.current;
      manualScriptLabelRef.current = undefined;
      if (endedLabel && directorScriptScrollsViewport(endedLabel)) {
        monitor.noteDirectorScriptEnd({ scriptLabel: endedLabel });
      }
    }

    prevScriptingRef.current = scripting;
  }, [monitor, snapshot.isScripting]);

  useLayoutEffect(() => {
    if (!scrollGuardActive) {
      prevChildIndexRef.current = null;
      prevProtoTabRef.current = null;
      prevAvailabilityOpenRef.current = false;
      return;
    }

    const childIndex = snapshot.childIndex ?? null;
    const protoTab = snapshot.protoTab ?? null;
    const availabilityOpen = Boolean(snapshot.availabilityOpen);
    const childChanged =
      prevChildIndexRef.current != null &&
      childIndex != null &&
      childIndex !== prevChildIndexRef.current;
    const protoTabChanged =
      prevProtoTabRef.current != null &&
      protoTab != null &&
      protoTab !== prevProtoTabRef.current;
    const availabilityChanged =
      prevAvailabilityOpenRef.current !== availabilityOpen;

    if (childChanged || protoTabChanged || availabilityChanged) {
      monitor.noteScreenChange();
    }
    prevChildIndexRef.current = childIndex;
    prevProtoTabRef.current = protoTab;
    prevAvailabilityOpenRef.current = availabilityOpen;
  }, [
    monitor,
    scrollGuardActive,
    snapshot.availabilityOpen,
    snapshot.childIndex,
    snapshot.protoTab,
  ]);

  useEffect(() => {
    monitor.setActive(scrollGuardActive);

    if (!scrollGuardActive) {
      if (!monitor.isBurstWatchActive()) {
        monitor.reset();
      }
      return;
    }

    const scrollEl = scrollRootRef.current ?? getPrototypeScrollRoot();
    if (!scrollEl) return;

    let raf = 0;
    let lastTop = scrollEl.scrollTop;
    let lastTime = performance.now();

    const onScroll = () => {
      const snap = snapshotRef.current;
      const top = scrollEl.scrollTop;
      if (
        shouldReportPassiveScrollAnomaly({
          isOnAir: snap.isOnAir,
          isPausingBeforeReveal: snap.isPausingBeforeReveal,
          journeyAtEnd: snap.journeyAtEnd,
        })
      ) {
        monitor.onPassiveScroll(top);
      } else {
        monitor.noteScrollPosition(top);
      }
    };

    const sample = (now: number) => {
      const snap = snapshotRef.current;
      const active =
        snap.isOnAir || snap.isPausingBeforeReveal || Boolean(snap.journeyMode);
      if (!active) return;

      const top = scrollEl.scrollTop;
      if (top !== lastTop) {
        if (
          shouldReportPassiveScrollAnomaly({
            isOnAir: snap.isOnAir,
            isPausingBeforeReveal: snap.isPausingBeforeReveal,
            journeyAtEnd: snap.journeyAtEnd,
          })
        ) {
          monitor.onPassiveScroll(top);
        } else {
          monitor.noteScrollPosition(top);
        }
        lastTop = top;
      }
      lastTime = now;
      raf = requestAnimationFrame(sample);
    };

    scrollEl.addEventListener("scroll", onScroll, { passive: true });
    raf = requestAnimationFrame(sample);

    return () => {
      scrollEl.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(raf);
    };
  }, [
    monitor,
    scrollRootRef,
    snapshot.childIndex,
    scrollGuardActive,
    snapshot.journeyMode,
  ]);
}
