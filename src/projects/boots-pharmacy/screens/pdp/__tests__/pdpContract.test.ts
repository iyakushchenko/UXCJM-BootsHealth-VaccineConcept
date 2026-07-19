import { describe, expect, it } from "vitest";

import {
  INDEX_PDP,
  PROJECT_SCREENS,
} from "@/projects/boots-pharmacy/screens/screens";
import {
  PDP_ACCORDION_DEFAULT_OPEN,
  PDP_ACCORDION_PANELS,
  PDP_APPOINTMENT_STRIP,
  PDP_CHILD_INDEX,
  PDP_INTRO_PARAGRAPHS,
  PDP_REACT_SCREEN_ID,
  PDP_SCREEN_SELECTOR,
  PDP_SERVICE_BLURB,
  PDP_SPECS_ROWS,
} from "../pdpContract";

describe("pdpContract", () => {
  it("matches Studio screen registry child index for PDP", () => {
    const screen = PROJECT_SCREENS.find((s) =>
      /pdp\. vaccine details page/i.test(s.label)
    );
    expect(screen?.childIndex).toBe(PDP_CHILD_INDEX);
    expect(screen?.screenId).toBe(PDP_REACT_SCREEN_ID);
    expect(INDEX_PDP).toBe(
      PROJECT_SCREENS.findIndex((s) => s.childIndex === PDP_CHILD_INDEX)
    );
    expect(PDP_SCREEN_SELECTOR).toContain(`nth-child(${PDP_CHILD_INDEX})`);
    expect(PDP_REACT_SCREEN_ID).toBe("pdp");
  });

  it("locks below-fold Make copy for L16 / L18 / L19 (interactive accordion)", () => {
    expect(PDP_INTRO_PARAGRAPHS).toHaveLength(2);
    expect(PDP_SERVICE_BLURB).toMatch(/private Chickenpox Vaccination Service/i);
    expect(PDP_APPOINTMENT_STRIP).toMatch(/15 minutes/i);
    expect(PDP_SPECS_ROWS.map((r) => r.label)).toEqual([
      "Vaccine",
      "Course",
      "Administration",
      "Eligibility",
      "Price",
      "Availability",
    ]);
    expect(PDP_ACCORDION_PANELS).toHaveLength(6);
    expect([...PDP_ACCORDION_DEFAULT_OPEN]).toEqual(["who-is-at-risk"]);

    const withBody = PDP_ACCORDION_PANELS.filter((p) => p.body);
    expect(withBody.map((p) => p.id)).toEqual([
      "how-can-boots-help",
      "who-is-at-risk",
      "what-happens-at-appointment",
    ]);
    expect(
      withBody.find((p) => p.id === "how-can-boots-help")?.body
    ).toBe(PDP_SERVICE_BLURB);
    expect(
      withBody.find((p) => p.id === "who-is-at-risk")?.body
    ).toMatch(/weakened immune system/);
    expect(
      withBody.find((p) => p.id === "what-happens-at-appointment")?.body
    ).toMatch(/15 minutes/);
    expect(
      withBody.find((p) => p.id === "what-happens-at-appointment")?.body
    ).toMatch(/upper arm or thigh/);

    const residual = PDP_ACCORDION_PANELS.filter((p) => p.body == null);
    expect(residual.map((p) => p.id)).toEqual([
      "nhs-vaccination",
      "already-have-chickenpox",
      "personal-data",
    ]);
    expect(PDP_ACCORDION_PANELS.every((p) => p.id && p.title)).toBe(true);
  });
});
