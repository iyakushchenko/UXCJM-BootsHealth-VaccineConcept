import { useEffect, type RefObject } from "react";

import { getPrototypeScrollRoot } from "@/app/scenario/playbackScroll";

import { bindProtoJourneyScrollLock } from "@/app/shell/journeyScrollLock";

type Options = {
  /** Journey/CJM mode is on and prototype pane is visible. */
  active: boolean;
  scrollRootRef: RefObject<HTMLElement | null>;
};

/** Prevents manual prototype scroll during journey playback (wheel, touch, keys). */
export function useJourneyScrollLock({
  active,
  scrollRootRef,
}: Options): void {
  useEffect(() => {
    if (!active) return;

    const scrollEl = scrollRootRef.current ?? getPrototypeScrollRoot();
    if (!scrollEl) return;

    return bindProtoJourneyScrollLock(scrollEl);
  }, [active, scrollRootRef]);
}
