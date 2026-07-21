import type { ProjectDefinition } from "@/projects/types";
import { formatProjectId } from "@/projects/formatProjectId";
import { EXAMPLE_SHOPPER_PERSONA } from "@/projects/puma/personas/example-shopper";
import { PUMA_PLAYBACK } from "@/projects/puma/playback";
import { EMPTY_PROJECT_CONTENT } from "@/app/shell/emptyProjectContent";

export const PUMA_PROJECT: ProjectDefinition = {
  id: formatProjectId("puma"),
  brand: "puma",
  label: "UXDS - Larkin",
  content: EMPTY_PROJECT_CONTENT,
  personas: [EXAMPLE_SHOPPER_PERSONA],
  defaultPersonaId: EXAMPLE_SHOPPER_PERSONA.id,
  playback: PUMA_PLAYBACK,
};

export * as pumaContent from "@/projects/puma/content";
