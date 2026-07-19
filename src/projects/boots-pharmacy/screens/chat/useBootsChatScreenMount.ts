import { useMemo, type Dispatch, type SetStateAction } from "react";
import type { AvailOpenIntent } from "@/projects/boots-pharmacy/overlays/AvailabilityTool";
import { createChatScreenProps } from "./chatScreenActions";
import { useChatScreenMount } from "./mountChatScreen";

const CHAT_AVAIL_INTENTS = {
  start: { step: "start" } satisfies AvailOpenIntent,
  dateToday: {
    step: "date",
    storeId: "covent",
    selectedDate: { month: "June", day: 12 },
  } satisfies AvailOpenIntent,
  dateChat: {
    step: "date",
    storeId: "covent",
    selectedDate: { month: "June", day: 25 },
  } satisfies AvailOpenIntent,
  timeSlot: {
    step: "time",
    storeId: "covent",
    selectedDate: { month: "June", day: 25 },
    selectedTime: "16:30",
  } satisfies AvailOpenIntent,
} as const;

/** Boots wire adapter — Chat React mount + CTA/chip → avail/PLP/PDP. */
export function useBootsChatScreenMount(
  activeChildIndex: number | undefined,
  options: {
    openAvailabilityRef: { current?: (intent: AvailOpenIntent) => void };
    setCurrent: Dispatch<SetStateAction<number>>;
  }
): void {
  const { openAvailabilityRef, setCurrent } = options;
  const props = useMemo(
    () =>
      createChatScreenProps({
        openAvailability: (intent) => openAvailabilityRef.current?.(intent),
        goPlp: () => setCurrent(2),
        goPdp: () => setCurrent(3),
        intents: CHAT_AVAIL_INTENTS,
      }),
    [openAvailabilityRef, setCurrent]
  );
  useChatScreenMount(activeChildIndex, props);
}
