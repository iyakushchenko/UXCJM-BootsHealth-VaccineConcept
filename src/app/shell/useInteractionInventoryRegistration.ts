import { useEffect, type MutableRefObject, type RefObject } from "react";
import {
  registerInteractionInventory,
  type InteractionSurface,
} from "@/app/shell/interactionInventory";

type Screen = { screenId: string; label: string };

export function useInteractionInventoryRegistration(options: {
  projectId: string;
  screens: readonly Screen[];
  hubLabel: string;
  hubOpenRef: MutableRefObject<boolean>;
  currentRef: MutableRefObject<number>;
  hubRootRef: RefObject<HTMLElement | null>;
  screenRootRef: RefObject<HTMLElement | null>;
  goRef: MutableRefObject<(index: number) => void>;
  wireApiRef?: RefObject<{ closeAllPopups: () => void } | null>;
}): void {
  useEffect(() => {
    const surfaces: InteractionSurface[] = [
      { id: "hub", label: options.hubLabel, kind: "hub" },
      ...options.screens.map((screen, index) => ({
        id: screen.screenId,
        label: screen.label,
        kind: "screen" as const,
        index,
      })),
    ];
    const activeSurface = (): InteractionSurface =>
      options.hubOpenRef.current
        ? surfaces[0]!
        : surfaces[options.currentRef.current + 1] ?? surfaces[0]!;
    return registerInteractionInventory({
      projectId: options.projectId,
      surfaces,
      getActiveSurface: activeSurface,
      getActiveRoot: () =>
        (options.hubOpenRef.current
          ? options.hubRootRef.current
          : options.screenRootRef.current) ??
        document.querySelector<HTMLElement>(".studio-wire-mount"),
      navigate: (surface) => {
        if (surface.kind === "hub") {
          if (!options.hubOpenRef.current) {
            document
              .querySelector<HTMLButtonElement>('button[data-studio-action="nav-hub"]')
              ?.click();
          }
          return;
        }
        options.goRef.current(surface.index ?? 0);
      },
      prepare: async () => {
        window.__protoSetJourneyMode?.(false);
        options.wireApiRef?.current?.closeAllPopups();
        await new Promise((resolve) => setTimeout(resolve, 140));
      },
    });
  }, [
    options.projectId,
    options.screens,
    options.hubLabel,
    options.hubOpenRef,
    options.currentRef,
    options.hubRootRef,
    options.screenRootRef,
    options.goRef,
    options.wireApiRef,
  ]);
}
