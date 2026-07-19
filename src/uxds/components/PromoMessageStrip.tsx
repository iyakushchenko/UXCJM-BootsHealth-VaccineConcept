import type { HTMLAttributes, ReactNode } from "react";

export type PromoMessageStripProps = {
  /** Brand / service mark (usually `<img>`). */
  logo: ReactNode;
  /** Promo body copy. */
  text: ReactNode;
  /**
   * CTA slot — pass kit `TertiaryCta` (typically `compact soft` + icon).
   * Do not invent page-local button CSS.
   */
  cta: ReactNode;
  className?: string;
  "data-name"?: string;
  /** Stable recording / MCP hook for the promo band. */
  "data-studio-promo"?: string;
} & Omit<HTMLAttributes<HTMLDivElement>, "children" | "className">;

/**
 * Soft mint promo strip — logo + copy + CTA.
 * Reusable for Online Doctor and similar service promos.
 * Surface: `var(--uxds-surface-accent-soft)`. CTA via kit TertiaryCta only.
 */
export function PromoMessageStrip({
  logo,
  text,
  cta,
  className,
  "data-name": dataName = "component.promo.message.strip",
  "data-studio-promo": dataStudioPromo,
  ...rest
}: PromoMessageStripProps) {
  return (
    <div
      className={`uxds-promo-message-strip${className ? ` ${className}` : ""}`}
      data-name={dataName}
      {...(dataStudioPromo
        ? { "data-studio-promo": dataStudioPromo }
        : {})}
      {...rest}
    >
      <div className="uxds-promo-message-strip__row">
        <div className="uxds-promo-message-strip__logo">{logo}</div>
        <p className="uxds-promo-message-strip__text">{text}</p>
        <div className="uxds-promo-message-strip__cta">{cta}</div>
      </div>
    </div>
  );
}
