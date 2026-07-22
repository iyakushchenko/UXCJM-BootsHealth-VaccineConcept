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

/**
 * Screens that run their own async "content-load interim" (a spinner band
 * over otherwise-live content, e.g. PLP's listing reload, Chat's browse
 * entry reveal) mark it with `data-studio-content-loading="<screenId>"` on
 * `document.body` for the duration. That reveal timer is intentionally
 * uncompressed by fast/test playback (it must look the same for a human and
 * a smoke) — which means any scripted interaction that starts before it
 * clears can land mid-reveal and silently lose a click's visual effect
 * (optimistic UI state reset alongside the re-render).
 *
 * This is a director-owned safety net: every beat script goes through one
 * choke point (`invokeBeatScript`), so screens only need to set the
 * attribute — they never have to hand-author a wait, and new screens get
 * this protection for free. Screen-specific scripts may still add their own
 * more precise wait (e.g. for a specific element) if they need finer control.
 */
export async function waitForContentLoadSettled(
  options?: { shouldAbort?: () => boolean; timeoutMs?: number }
): Promise<void> {
  if (typeof document === "undefined") return;
  const timeoutMs = options?.timeoutMs ?? 4000;
  const started = performance.now();
  while (performance.now() - started < timeoutMs) {
    if (!document.body?.hasAttribute("data-studio-content-loading")) return;
    if (options?.shouldAbort?.()) return;
    await playbackReadinessDelay(50);
  }
}
