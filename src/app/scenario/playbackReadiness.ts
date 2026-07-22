/**
 * Wall-clock polling for DOM/runtime readiness.
 *
 * Fast playback compresses presentation dwell and animation time only. It
 * must never compress React mount, popup, route, or control-readiness guards;
 * doing so makes a valid journey race the page and fail nondeterministically.
 */
export function playbackReadinessDelay(ms = 40): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, Math.max(16, ms)));
}
