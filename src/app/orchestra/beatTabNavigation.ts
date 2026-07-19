/**
 * Whether beat-enter may call goToTab for the beat's protoTab.
 *
 * When CJM is off (`scenarioBrowseMode`), manual Studio tabs own the viewport.
 * Beat-index sync may fall back to the journey start beat for screens outside
 * the active CJM (e.g. Book Step 1 under agentic-cjm) — that must not redirect.
 */
export function shouldNavigateBeatTabOnEnter(
  scenarioBrowseMode: boolean,
  suppressInitialBeatTabNav: boolean
): boolean {
  return !suppressInitialBeatTabNav && !scenarioBrowseMode;
}

/**
 * Product journey tab nav — **always** invoke `goToTab`.
 *
 * Skipping when `currentTabIndex === target` leaves `hubOpen=true` (hub overlay
 * sits on the same underlying tab). Jump-to-start / Play-end / Stop-at-end then
 * look like "return to hub". `goToTab` must close hub even on a no-op tab index.
 */
export function navigateToBeatTab(
  runtime: {
    goToTab: (screenIndex: number, options?: { instant?: boolean }) => void;
  },
  tabIndex: number,
  options?: { instant?: boolean }
): void {
  runtime.goToTab(tabIndex, options);
}
