/**
 * Wire-mount nav crossfade policy.
 *
 * Same-tab journey advances (book-step2 date→time→reserve) must still call
 * goToTab so hub closes, but must NOT run the opacity blink on `.studio-wire-mount`.
 */

export type NavTransitionRunOptions = {
  instant?: boolean;
  sameTab?: boolean;
  screenBefore?: string | null;
  screenAfter?: string | null;
};

export function resolveNavTransitionInstant(options: {
  requestedInstant?: boolean;
  hubOpen: boolean;
  currentIndex: number;
  targetIndex: number;
}): boolean {
  if (options.requestedInstant) return true;
  // Hub already closed + same tab index → skip crossfade (no visual swap).
  if (!options.hubOpen && options.currentIndex === options.targetIndex) {
    return true;
  }
  return false;
}

/** Build options for journey goToTab → useNavTransition (hub-safe, blink-safe). */
export function buildJourneyGoToTabTransition(options: {
  screenIndex: number;
  requestedInstant?: boolean;
  hubOpen: boolean;
  currentIndex: number;
  screenIdAfter?: string | null;
}): {
  sameTab: boolean;
  transition: NavTransitionRunOptions;
} {
  const sameTab = !options.hubOpen && options.currentIndex === options.screenIndex;
  const instant = resolveNavTransitionInstant({
    requestedInstant: options.requestedInstant,
    hubOpen: options.hubOpen,
    currentIndex: options.currentIndex,
    targetIndex: options.screenIndex,
  });
  const screenBefore =
    typeof location !== "undefined"
      ? new URLSearchParams(location.search).get("screen")
      : null;
  return {
    sameTab,
    transition: {
      instant,
      sameTab,
      screenBefore,
      screenAfter: options.screenIdAfter ?? screenBefore,
    },
  };
}
