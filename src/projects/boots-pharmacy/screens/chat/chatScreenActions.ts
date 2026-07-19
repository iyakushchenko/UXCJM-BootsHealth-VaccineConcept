/**
 * Chat React action wiring — kept out of BootsPharmacyProjectView monster.
 */

import type { AvailOpenIntent } from "@/projects/boots-pharmacy/overlays/AvailabilityTool";
import { isStudioLoggedIn } from "@/app/shell/studioAuthSession";
import type { ChatScreenProps } from "./ChatScreen";

const AVAIL_DEMO_STORE = "covent";

export type ChatAvailIntentBag = {
  start: AvailOpenIntent;
  dateToday: AvailOpenIntent;
  dateChat: AvailOpenIntent;
  timeSlot: AvailOpenIntent;
};

export function createChatScreenProps(options: {
  openAvailability: (intent: AvailOpenIntent) => void;
  goPlp: () => void;
  goPdp: () => void;
  intents: ChatAvailIntentBag;
}): ChatScreenProps {
  const { openAvailability, goPlp, goPdp, intents } = options;

  return {
    onChip: (label) => {
      if (/^show available slots for today$/i.test(label)) {
        openAvailability(intents.dateToday);
      }
    },
    onAgentCta: (label) => {
      const t = label.trim();
      if (/^go to vaccines catalog$/i.test(t)) {
        goPlp();
        return;
      }
      if (
        /^book\s+(southeast asia vaccine bundle|yellow fever vaccine)/i.test(t)
      ) {
        goPdp();
        return;
      }
      if (/^select different pharmacy$/i.test(t)) {
        const intent: AvailOpenIntent = { step: "list", query: "London" };
        if (isStudioLoggedIn()) intent.storeId = AVAIL_DEMO_STORE;
        openAvailability(intent);
        return;
      }
      if (/^open availability checker tool$/i.test(t)) {
        openAvailability(intents.start);
        return;
      }
      if (/^choose time slot$/i.test(t)) {
        openAvailability(intents.timeSlot);
        return;
      }
      if (/^choose different date$/i.test(t)) {
        openAvailability(intents.dateChat);
      }
    },
    onProductLink: (label) => {
      const t = label.trim();
      if (/^availability checker tool$/i.test(t)) {
        openAvailability(intents.start);
        return;
      }
      if (
        /^(southeast asia vaccine bundle|hepatitis a|typhoid|tetanus booster|yellow fever vaccine)$/i.test(
          t
        )
      ) {
        goPdp();
      }
    },
  };
}
