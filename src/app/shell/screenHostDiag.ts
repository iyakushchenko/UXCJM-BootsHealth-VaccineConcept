/**
 * Minimal screen-host blink forensics for React pilots (book-step-2/3).
 * Samples opacity/visibility + Motion presence under `.studio-react-screen-host`.
 */
import { playbackDiagScreenEnter } from "@/app/shell/playbackDiag";

function sampleHostPresence(host: HTMLElement | null): {
  opacity: number | null;
  visibility: string | null;
  motionPresence: boolean;
} {
  if (!host || typeof getComputedStyle !== "function") {
    return { opacity: null, visibility: null, motionPresence: false };
  }
  const style = getComputedStyle(host);
  const opacity = Number.parseFloat(style.opacity);
  // framer-motion leaves projection / appear markers when AnimatePresence/motion.* mounts.
  const motionPresence = Boolean(
    host.querySelector(
      "[data-projection-id], [data-framer-appear-id], [data-framer-component-type]"
    )
  );
  return {
    opacity: Number.isFinite(opacity) ? opacity : null,
    visibility: style.visibility || null,
    motionPresence,
  };
}

/** Log screen-enter + remount/render counters for a React screen host. */
export function noteReactScreenHostEnter(options: {
  screenId: string;
  host: HTMLElement | null;
  remountCount: number;
  renderCount: number;
  createdRoot: boolean;
}): void {
  const sample = sampleHostPresence(options.host);
  let wireOpacity: number | null = null;
  try {
    const mount = document.querySelector(
      ".studio-wire-mount"
    ) as HTMLElement | null;
    if (mount) {
      const op = Number.parseFloat(getComputedStyle(mount).opacity);
      wireOpacity = Number.isFinite(op) ? op : null;
    }
  } catch {
    wireOpacity = null;
  }
  playbackDiagScreenEnter({
    screenId: options.screenId,
    remountCount: options.remountCount,
    renderCount: options.renderCount,
    createdRoot: options.createdRoot,
    opacity: sample.opacity,
    visibility: sample.visibility,
    motionPresence: sample.motionPresence,
    detail: `screen-enter ${options.screenId} remount=${options.remountCount} render=${options.renderCount} createdRoot=${options.createdRoot} hostOpacity=${sample.opacity ?? "?"} wireOpacity=${wireOpacity ?? "?"} visibility=${sample.visibility ?? "?"} motion=${sample.motionPresence ? "yes" : "no"}`,
  });
}
