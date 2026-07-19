/**
 * Shared Accordion expand/collapse timings — Motion height + opacity
 * (via `@/uxds/motion`). Chevron mute/rotate stays CSS.
 */

/** Premium ease-out (interactive kit pieces). */
export const ACCORDION_EASE = [0.22, 1, 0.36, 1] as const;

/** Matches AccordionContent Motion height duration. */
export const ACCORDION_CONTENT_DURATION_S = 0.32;

/** Probe settle floor — duration + small buffer for paint. */
export const ACCORDION_PROBE_SETTLE_MS = Math.ceil(
  ACCORDION_CONTENT_DURATION_S * 1000 + 80
);

/** Height tween for AccordionContent shell. */
export const accordionContentTransition = {
  duration: ACCORDION_CONTENT_DURATION_S,
  ease: ACCORDION_EASE,
} as const;

/** Panel fade — open slightly delayed so height leads; close fades faster. */
export function accordionPanelOpacityTransition(open: boolean) {
  return {
    duration: open ? 0.22 : 0.14,
    ease: ACCORDION_EASE,
    delay: open ? 0.04 : 0,
  } as const;
}
