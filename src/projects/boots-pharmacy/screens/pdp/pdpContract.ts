/** Studio / CJM contract for PDP React migration. */

export const PDP_CHILD_INDEX = 8;

export const PDP_REACT_SCREEN_ID = "pdp";

export const PDP_SCREEN_SELECTOR = `.studio-viewport > div > div:nth-child(${PDP_CHILD_INDEX})`;

/** L16 — Make Frame106 intro copy (864px band). */
export const PDP_INTRO_PARAGRAPHS = [
  "Chickenpox is a common viral infection caused by the varicella-zoster virus. It spreads easily through coughing, sneezing and direct contact, and can cause fever, tiredness and an itchy blister-like rash.",
  "The Boots Chickenpox Vaccination Service is a private service for eligible adults and children aged one to 65. A full course is two doses, with suitability checked by a healthcare professional before vaccination.",
] as const;

/**
 * Make RTB service blurb (Frame PDP body) — also used as FAQ “How can Boots help?”
 * body (Make accordion Description missing for that panel; RTB is same-page Make copy).
 */
export const PDP_SERVICE_BLURB =
  "Our private Chickenpox Vaccination Service is suitable for adults and children aged between one and 65 years. A full course consists of two doses given 4 to 6 weeks apart. Eligibility criteria apply and suitability will be checked before each vaccination is given.";

/** Make appointment strip copy (Frame). */
export const PDP_APPOINTMENT_STRIP =
  "Typical appointment takes around 15 minutes";

/** L18 — Make laptop specs table rows. */
export const PDP_SPECS_ROWS = [
  { label: "Vaccine", value: "Varicella-zoster virus vaccine" },
  { label: "Course", value: "Two doses, usually 4 to 6 weeks apart" },
  {
    label: "Administration",
    value:
      "Given in the upper arm or thigh by a trained healthcare professional",
  },
  {
    label: "Eligibility",
    value: "Adults and children aged 1 to 65, subject to suitability checks",
  },
  {
    label: "Price",
    value: "£98.95 per dose, £190.00 for the full two-dose course",
  },
  {
    label: "Availability",
    value: "Private service available at selected Boots pharmacies",
  },
] as const;

/**
 * L19 — FAQ accordion (PO go: interactive UXDS Accordion kit).
 *
 * Make `ComponentPdpAccordion` only ships a `Description` node for “Who is at risk?”.
 * Bodies below reuse other Make PDP strings on the same page where they answer the
 * header — never invented marketing. Panels still without Make source stay `null`
 * (documented residual in PDP_MAKE_PARITY_REGISTER).
 *
 * Default open matches Make static frame.
 */
export const PDP_ACCORDION_DEFAULT_OPEN = ["who-is-at-risk"] as const;

const PDP_SPECS_ADMINISTRATION =
  PDP_SPECS_ROWS.find((r) => r.label === "Administration")?.value ?? "";

export const PDP_ACCORDION_PANELS = [
  {
    id: "how-can-boots-help",
    title: "How can Boots help?",
    /** Make RTB service blurb (same page; accordion Description absent in export). */
    body: PDP_SERVICE_BLURB,
  },
  {
    id: "who-is-at-risk",
    title: "Who is at risk?",
    /** Make `Description` under ComponentPdpAccordion. */
    body: "Chickenpox can affect any age, but complications are more likely in adults, pregnant women, newborn babies and people with a weakened immune system.",
  },
  {
    id: "what-happens-at-appointment",
    title: "What happens at the appointment?",
    /** Make appt strip + specs Administration (no dedicated accordion Description). */
    body: `${PDP_APPOINTMENT_STRIP}. ${PDP_SPECS_ADMINISTRATION}.`,
  },
  {
    id: "nhs-vaccination",
    title: "Can I get vaccinated on the NHS?",
    /** Residual — no Make Description / journey / HTML body after search. */
    body: null,
  },
  {
    id: "already-have-chickenpox",
    title: "What if I already have chickenpox?",
    /** Residual — no Make Description / journey / HTML body after search. */
    body: null,
  },
  {
    id: "personal-data",
    title: "How we use your personal data",
    /** Residual — no Make Description / journey / HTML body after search. */
    body: null,
  },
] as const;
