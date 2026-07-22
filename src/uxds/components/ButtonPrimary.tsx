import type { ButtonHTMLAttributes, ReactNode } from "react";

export type ButtonPrimaryProps = {
  children: ReactNode;
  className?: string;
  "data-name"?: string;
  /** Stable recording / playback target (preferred over data-name alone). */
  "data-studio-action"?: string;
} & Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  "className" | "children" | "type"
> &
  Pick<ButtonHTMLAttributes<HTMLButtonElement>, "type">;

/**
 * Thin UXDS primary button — uses semantic token
 * `--uxds-input-button-surface-surface-primary-solid`.
 * Project `styleguide/theme.css` remaps that role for brand.
 * Commerce / navy CTAs: add class `uxds-btn-primary--commerce`.
 *
 * Project-specific selectors (e.g. legacy `data-studio-appointment-*`) belong
 * on the page via standard HTML attrs — not as kit props.
 */
export function ButtonPrimary({
  children,
  className,
  "data-name": dataName = "component.input.button",
  "data-studio-action": dataStudioAction,
  type = "button",
  ...rest
}: ButtonPrimaryProps) {
  return (
    <button
      type={type}
      className={`uxds-btn-primary${className ? ` ${className}` : ""}`}
      data-name={dataName}
      {...(dataStudioAction
        ? { "data-studio-action": dataStudioAction }
        : {})}
      {...rest}
    >
      {children}
    </button>
  );
}
