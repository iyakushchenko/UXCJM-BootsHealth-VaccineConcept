import type { ProjectDefinition } from "@/projects/types";
import { formatProjectId } from "@/projects/formatProjectId";
import { SARAH_JENKINS_PERSONA } from "@/projects/boots-pharmacy/personas/sarah-jenkins";
import { BOOTS_PHARMACY_POPUP_TOUCHPOINTS } from "@/projects/boots-pharmacy/touchpoints";
import { BOOTS_PHARMACY_PLAYBACK } from "@/projects/boots-pharmacy/playback";
import { BootsPharmacyProjectView } from "@/projects/boots-pharmacy/wire/BootsPharmacyProjectView";
import * as bootsPharmacyContent from "@/projects/boots-pharmacy/content";

export const BOOTS_PHARMACY_PROJECT: ProjectDefinition = {
  id: formatProjectId("boots", "pharmacy"),
  brand: "boots",
  subbrand: "pharmacy",
  label: "Boots Pharmacy",
  shortLabel: "Boots",
  content: bootsPharmacyContent,
  personas: [SARAH_JENKINS_PERSONA],
  defaultPersonaId: SARAH_JENKINS_PERSONA.id,
  popupTouchpoints: BOOTS_PHARMACY_POPUP_TOUCHPOINTS,
  playback: BOOTS_PHARMACY_PLAYBACK,
  wireComponent: BootsPharmacyProjectView,
};
export * as bootsPharmacyContent from "@/projects/boots-pharmacy/content";
