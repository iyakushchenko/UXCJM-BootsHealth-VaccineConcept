import "./pendingSpinnerIcon.css";

export type PendingSpinnerIconProps = {
  /** Icon box size in px — matches the glyph it temporarily replaces. */
  size?: number;
  className?: string;
};

/**
 * Shared "committing" icon-swap primitive — arc spinner in the same visual
 * language as PLP's listing content-load loader, promoted to a reusable
 * `src/uxds/interactions/` kit instead of a bespoke per-screen spinner.
 *
 * Intent: any control that optimistically flips to an active/selected state
 * ahead of a delayed real commit (wishlist, save, add-to-cart…) can swap its
 * glyph for this while pending, then swap back once the real state lands —
 * without inventing a new spinner motif per surface.
 *
 * Color is `currentColor` — the consumer's existing active-state color
 * (e.g. `.is-active { color: ... }`) drives the arc, so the icon reads as
 * "this exact control is committing," not a generic loader.
 */
export function PendingSpinnerIcon({
  size = 16,
  className,
}: PendingSpinnerIconProps) {
  return (
    <span
      className={`uxds-pending-spinner${className ? ` ${className}` : ""}`}
      data-name="uxds.interaction.pending-spinner"
      aria-hidden
    >
      <svg viewBox="0 0 44 44" width={size} height={size} aria-hidden>
        <circle
          className="uxds-pending-spinner__track"
          cx="22"
          cy="22"
          r="18"
          fill="none"
        />
        <circle
          className="uxds-pending-spinner__arc"
          cx="22"
          cy="22"
          r="18"
          fill="none"
        />
      </svg>
    </span>
  );
}
