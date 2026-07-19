import { useCallback, useRef, useState } from "react";
import {
  isAccordionItemOpen,
  toggleAccordionValue,
  type AccordionType,
} from "./accordionState";

/** Ignore double-fire / probe spam during CSS grid open/close (hang guard). */
const ACCORDION_TOGGLE_MIN_MS = 90;

export type UseAccordionOptions = {
  type?: AccordionType;
  /** Controlled open ids */
  value?: string[];
  defaultValue?: string[];
  onValueChange?: (open: string[]) => void;
};

export function useAccordion(options: UseAccordionOptions = {}) {
  const type = options.type ?? "single";
  const controlled = options.value !== undefined;
  const [uncontrolled, setUncontrolled] = useState<string[]>(
    options.defaultValue ?? []
  );
  const open = controlled ? (options.value as string[]) : uncontrolled;
  const lastToggleAtRef = useRef(0);

  const setOpen = useCallback(
    (next: string[]) => {
      if (!controlled) setUncontrolled(next);
      options.onValueChange?.(next);
    },
    [controlled, options]
  );

  const toggle = useCallback(
    (id: string) => {
      const now =
        typeof performance !== "undefined" && typeof performance.now === "function"
          ? performance.now()
          : Date.now();
      if (now - lastToggleAtRef.current < ACCORDION_TOGGLE_MIN_MS) return;
      lastToggleAtRef.current = now;
      setOpen(toggleAccordionValue(open, id, type));
    },
    [open, setOpen, type]
  );

  const isOpen = useCallback(
    (id: string) => isAccordionItemOpen(open, id),
    [open]
  );

  return { open, setOpen, toggle, isOpen, type };
}
