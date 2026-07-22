import { describe, expect, it } from "vitest";

import { PROJECT_SCREENS } from "@/projects/boots-pharmacy/screens/screens";
import { APPOINTMENT_COUNT } from "@/projects/boots-pharmacy/data/appointments";
import {
  APPOINTMENT_HISTORY_CHILD_INDEX,
  APPOINTMENT_HISTORY_NAV_ACTIVE,
  APPOINTMENT_HISTORY_NAV_ITEMS,
  APPOINTMENT_HISTORY_REACT_SCREEN_ID,
  APPOINTMENT_HISTORY_SCREEN_SELECTOR,
  APPOINTMENT_HISTORY_TITLE,
  appointmentHistoryDisplayedLabel,
  appointmentHistoryViewedLabel,
} from "../appointmentHistoryContract";

describe("appointmentHistoryContract", () => {
  it("matches Studio screen registry child index for Appointment History", () => {
    const screen = PROJECT_SCREENS.find(
      (s) => s.screenId === "appointment-history"
    );
    expect(screen?.childIndex).toBe(APPOINTMENT_HISTORY_CHILD_INDEX);
    expect(screen?.screenId).toBe(APPOINTMENT_HISTORY_REACT_SCREEN_ID);
    expect(APPOINTMENT_HISTORY_SCREEN_SELECTOR).toContain(
      `nth-child(${APPOINTMENT_HISTORY_CHILD_INDEX})`
    );
    expect(APPOINTMENT_HISTORY_CHILD_INDEX).toBe(2);
  });

  it("locks title / nav active / meta labels", () => {
    expect(APPOINTMENT_HISTORY_TITLE).toBe("Appointment History");
    expect(APPOINTMENT_HISTORY_NAV_ACTIVE).toBe("Appointment history");
    expect(APPOINTMENT_HISTORY_NAV_ITEMS).toContain(
      APPOINTMENT_HISTORY_NAV_ACTIVE
    );
    expect(appointmentHistoryDisplayedLabel(APPOINTMENT_COUNT)).toBe(
      `${APPOINTMENT_COUNT} Appointments displayed`
    );
    expect(appointmentHistoryViewedLabel(APPOINTMENT_COUNT)).toBe(
      `You've viewed ${APPOINTMENT_COUNT} of ${APPOINTMENT_COUNT} appointments`
    );
  });
});
