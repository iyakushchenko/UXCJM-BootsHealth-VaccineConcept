import { isHeaderLoggedIn } from "@/projects/boots-pharmacy/chrome/headerMount";
import { resolveAvailStoreId } from "@/projects/boots-pharmacy/data/availStores";
import type { AvailOpenIntent } from "@/projects/boots-pharmacy/overlays/AvailabilityTool";

export type AvailChosenLocation = {
  name: string;
  address: string;
  storeId?: string;
};

/** Demo pharmacy for chat-driven availability shortcuts (Covent Garden). */
const AVAIL_DEMO_STORE = "covent";

const AVAIL_START_INTENT: AvailOpenIntent = { step: "start" };

function mapChosenToAvailStoreId(chosen: AvailChosenLocation): string {
  return resolveAvailStoreId(chosen);
}

/**
 * Location-gated availability intents:
 *   no location  → Find Pharmacy (start)
 *   has location → date / time (or no-slots) with chosen store
 */
export function resolveAvailIntent(
  intent: AvailOpenIntent,
  chosen: AvailChosenLocation | null
): AvailOpenIntent {
  if (intent.pickLocation) return intent;
  if (intent.step === "start") return intent;

  // When logged in, treat as having a location even if none explicitly chosen
  const hasLocation = !!chosen || isHeaderLoggedIn();

  if (!hasLocation) {
    // Chat/playback shortcuts: explicit storeId bypasses location gate
    if (
      intent.storeId &&
      (intent.step === "date" || intent.step === "time")
    ) {
      return intent;
    }
    if (
      intent.step === "date" ||
      intent.step === "time" ||
      intent.step === "list" ||
      intent.step === "map"
    ) {
      return AVAIL_START_INTENT;
    }
    return intent;
  }

  const storeId = chosen ? mapChosenToAvailStoreId(chosen) : AVAIL_DEMO_STORE;

  if (intent.step === "date" || intent.step === "time") {
    return { ...intent, storeId };
  }

  if (intent.step === "list" || intent.step === "map") {
    return {
      step: "date",
      storeId,
      selectedDate: { month: "June", day: 24 },
    };
  }

  return intent;
}
