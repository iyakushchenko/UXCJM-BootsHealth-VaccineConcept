import type { ButtonHTMLAttributes, ReactNode } from "react";

export type ButtonPrimaryProps = {
  children: ReactNode;
  className?: string;
  "data-name"?: string;
  /** Stable recording / playback target (preferred over data-name alone). */
  "data-studio-action"?: string;
} & Pick<
  ButtonHTMLAttributes<HTMLButtonElement>,
  "onClick" | "type" | "disabled" | "aria-label"
>;

/**
 * Thin UXDS primary button — uses semantic token
 * `--uxds-input-button-surface-surface-primary-solid`.
 * Project `styleguide/theme.css` remaps that role for brand.
 * Commerce / navy CTAs: add class `uxds-btn-primary--commerce`.
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
