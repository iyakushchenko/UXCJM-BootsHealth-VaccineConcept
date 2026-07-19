import type { ButtonHTMLAttributes, ReactNode } from "react";

type TertiaryCtaProps = {
  children: ReactNode;
  icon?: ReactNode;
  compact?: boolean;
  className?: string;
} & Pick<ButtonHTMLAttributes<HTMLButtonElement>, "onClick" | "type" | "aria-label">;

/**
 * Tertiary icon + text CTA — transparent, no hover wash; icon→navy, label→black.
 * Styled via `.proto-tertiary-cta` in globals.css.
 */
export function TertiaryCta({
  children,
  icon,
  compact = false,
  className,
  onClick,
  type = "button",
  "aria-label": ariaLabel,
}: TertiaryCtaProps) {
  const sizeClass = compact ? " proto-tertiary-cta--compact" : "";

  return (
    <button
      type={type}
      className={`proto-tertiary-cta${sizeClass}${className ? ` ${className}` : ""}`}
      aria-label={ariaLabel}
      onClick={onClick}
    >
      {icon ? <span className="proto-tertiary-cta__icon">{icon}</span> : null}
      <span className="proto-tertiary-cta__label">{children}</span>
    </button>
  );
}
