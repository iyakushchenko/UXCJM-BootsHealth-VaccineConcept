/** Studio / CJM contract for PDP React migration. */
export const PDP_CHILD_INDEX = 8;
export const PDP_REACT_SCREEN_ID = "pdp";
export const PDP_SCREEN_SELECTOR = `.studio-viewport > div > div:nth-child(${PDP_CHILD_INDEX})`;

/** L16 — Make Frame106 intro copy (864px band). */
export const PDP_INTRO_PARAGRAPHS = [
  "Chickenpox is a common viral infection caused by the varicella-zoster virus. It spreads easily through coughing, sneezing and direct contact, and can cause fever, tiredness and an itchy blister-like rash.",
  "The Boots Chickenpox Vaccination Service is a private service for eligible adults and children aged one to 65. A full course is two doses, with suitability checked by a healthcare professional before vaccination.",
] as const;

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
 * Make only ships body copy for “Who is at risk?” — other panels expand/collapse
 * with chevron + a11y; no invented FAQ bodies.
 * Default open matches Make static frame.
 */
export const PDP_ACCORDION_DEFAULT_OPEN = ["who-is-at-risk"] as const;

export const PDP_ACCORDION_PANELS = [
  {
    id: "how-can-boots-help",
    title: "How can Boots help?",
    body: null,
  },
  {
    id: "who-is-at-risk",
    title: "Who is at risk?",
    body: "Chickenpox can affect any age, but complications are more likely in adults, pregnant women, newborn babies and people with a weakened immune system.",
  },
  {
    id: "what-happens-at-appointment",
    title: "What happens at the appointment?",
    body: null,
  },
  {
    id: "nhs-vaccination",
    title: "Can I get vaccinated on the NHS?",
    body: null,
  },
  {
    id: "already-have-chickenpox",
    title: "What if I already have chickenpox?",
    body: null,
  },
  {
    id: "personal-data",
    title: "How we use your personal data",
    body: null,
  },
] as const;
