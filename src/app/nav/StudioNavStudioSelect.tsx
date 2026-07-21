import { Fragment, type ReactNode, useCallback, useEffect, useId, useRef, useState } from "react";
import type { StudioSelectOption } from "@/projects/types";
import {
  logControlPanel,
  type ControlPanelAction,
} from "@/app/shell/controlPanelLog";
import { studioPanelTransition } from "@/app/nav/studioMotion";
import { AnimatePresence, motion } from "@/uxds/motion";

type Props<T extends string> = {
  options: StudioSelectOption<T>[];
  value: T;
  onChange: (id: T) => void;
  ariaLabel: string;
  /** Console log action id for studio select interactions. */
  logAction?: ControlPanelAction;
  /** Overrides selected label while transport is on-air (journey mode only). */
  liveLabel?: string;
  isPlaying?: boolean;
  controlsLocked?: boolean;
  /**
   * Force closed-trigger label (e.g. REC live → "NEW CJM").
   * Wins over the selected option / liveLabel.
   */
  displayLabelOverride?: string | null;
  /** Gold trigger chrome — Studio active-option language (REC new path). */
  highlightGold?: boolean;
  /** Draw a separator line after this option id (e.g. CREATE NEW CJM). */
  separatorAfterId?: T | null;
  /** Tooltip when the trigger is disabled. */
  disabledTitle?: string;
  /** Optional trailing action rendered inside each dropdown option row. */
  renderOptionAction?: (option: StudioSelectOption<T>) => ReactNode;
  renderOptionMeta?: (option: StudioSelectOption<T>) => ReactNode;
};

/** Compact studio dropdown — project, persona, or journey mode. */
export function StudioNavStudioSelect<T extends string>({
  options,
  value,
  onChange,
  ariaLabel,
  logAction,
  liveLabel,
  isPlaying = false,
  controlsLocked = false,
  displayLabelOverride = null,
  highlightGold = false,
  separatorAfterId = null,
  disabledTitle,
  renderOptionAction,
  renderOptionMeta,
}: Props<T>) {
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const optionRefs = useRef<(HTMLDivElement | null)[]>([]);
  const listId = useId();
  const triggerDisabled = isPlaying || controlsLocked;

  const selected =
    options.find((option) => option.id === value) ??
    options[0] ??
    ({ id: value, label: value } as StudioSelectOption<T>);

  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (triggerDisabled) close();
  }, [close, triggerDisabled]);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        close();
      }
    };
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [close, open]);

  useEffect(() => {
    if (open) {
      const idx = options.findIndex((option) => option.id === value);
      setActiveIndex(idx >= 0 ? idx : 0);
    }
  }, [open, options, value]);

  useEffect(() => {
    if (!open || options.length === 0) return;
    const frame = window.requestAnimationFrame(() => {
      optionRefs.current[activeIndex]?.focus();
    });
    return () => window.cancelAnimationFrame(frame);
  }, [activeIndex, open, options.length]);

  const closeAndRestoreFocus = () => {
    close();
    window.requestAnimationFrame(() => triggerRef.current?.focus());
  };

  const selectOption = (id: T) => {
    if (logAction) {
      logControlPanel(logAction, {
        ariaLabel,
        from: value,
        to: id,
        controlsLocked,
        isPlaying,
      });
    }
    onChange(id);
    closeAndRestoreFocus();
  };

  const toggleOpen = () => {
    if (triggerDisabled) {
      return;
    }
    setOpen((prev) => {
      const next = !prev;
      if (logAction) {
        logControlPanel(next ? "studio:select-open" : "studio:select-close", {
          ariaLabel,
          logAction,
          value,
        });
      }
      return next;
    });
  };

  const onTriggerKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>) => {
    if (event.key === "ArrowDown" || event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      setOpen(true);
    }
  };

  const onListKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if ((event.target as HTMLElement).closest("[data-studio-option-action]")) return;
    if (event.key === "Escape") {
      event.preventDefault();
      closeAndRestoreFocus();
      return;
    }
    if (options.length === 0) return;
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((i) => (i + 1) % options.length);
      return;
    }
    if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((i) => (i - 1 + options.length) % options.length);
      return;
    }
    if (event.key === "Home") {
      event.preventDefault();
      setActiveIndex(0);
      return;
    }
    if (event.key === "End") {
      event.preventDefault();
      setActiveIndex(options.length - 1);
      return;
    }
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      const option = options[activeIndex];
      if (option) selectOption(option.id);
    }
  };

  const displayLabel =
    displayLabelOverride?.trim() ||
    (isPlaying && liveLabel
      ? liveLabel
      : (selected.shortLabel ?? selected.label));

  return (
    <div
      className={
        highlightGold
          ? "studio-nav-journey-menu studio-nav-journey-menu--new-cjm"
          : "studio-nav-journey-menu"
      }
      ref={rootRef}
      data-studio-new-cjm={highlightGold ? "" : undefined}
    >
      <button
        ref={triggerRef}
        type="button"
        className="studio-nav-journey-menu__trigger"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        aria-label={`${ariaLabel}: ${displayLabel}`}
        data-studio-action={`${ariaLabel.toLowerCase().replace(/\s+/g, "-")}-select`}
        disabled={triggerDisabled}
        title={triggerDisabled ? disabledTitle : undefined}
        onClick={toggleOpen}
        onKeyDown={onTriggerKeyDown}
      >
        <span className="studio-nav-journey-menu__label">{displayLabel}</span>
        <svg
          className="studio-nav-journey-menu__chevron"
          width="8"
          height="8"
          viewBox="0 0 8 8"
          fill="none"
          aria-hidden
        >
          <path
            d="M1.5 2.5L4 5L6.5 2.5"
            stroke="currentColor"
            strokeWidth="1.25"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
      <AnimatePresence initial={false}>
        {open ? (
          <motion.div
            key="studio-select-panel"
            id={listId}
            role="listbox"
            aria-label={ariaLabel}
            className="studio-nav-journey-menu__panel"
            tabIndex={-1}
            onKeyDown={onListKeyDown}
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={studioPanelTransition}
          >
            {options.map((option, index) => (
              <Fragment key={option.id}>
                <div
                  ref={(node) => {
                    optionRefs.current[index] = node;
                  }}
                  type="button"
                  role="option"
                  aria-label={option.label}
                  aria-selected={option.id === value}
                  tabIndex={index === activeIndex ? 0 : -1}
                  data-studio-action={`${ariaLabel.toLowerCase().replace(/\s+/g, "-")}-option`}
                  className={
                    option.id === value
                      ? "studio-nav-journey-menu__option studio-nav-journey-menu__option--active"
                      : "studio-nav-journey-menu__option"
                  }
                  onMouseEnter={() => setActiveIndex(index)}
                  onFocus={() => setActiveIndex(index)}
                  onClick={() => selectOption(option.id)}
                >
                  <span className="studio-nav-journey-menu__option-copy">
                    <span className="studio-nav-journey-menu__option-label">
                      {option.label}
                    </span>
                    {renderOptionMeta ? (
                      <span className="studio-nav-journey-menu__option-meta">
                        {renderOptionMeta(option)}
                      </span>
                    ) : null}
                  </span>
                  {renderOptionAction ? (
                    <span
                      className="studio-nav-journey-menu__option-action"
                      data-studio-option-action=""
                      onClick={(event) => event.stopPropagation()}
                    >
                      {renderOptionAction(option)}
                    </span>
                  ) : null}
                </div>
                {separatorAfterId != null && separatorAfterId === option.id ? (
                  <div
                    role="separator"
                    className="studio-nav-journey-menu__separator"
                    data-studio-cjm-separator=""
                  />
                ) : null}
              </Fragment>
            ))}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
