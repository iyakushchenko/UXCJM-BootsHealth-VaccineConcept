import type { PersonaDefinition } from "@/projects/types";
import {
  AGENTIC_CJM_JOURNEY,
  TRADITIONAL_CJM_JOURNEY,
  shouldSkipTraditionalLoginBeat,
} from "@/projects/boots-pharmacy/personas/sarah-jenkins/journeys";

export const SARAH_JENKINS_PERSONA: PersonaDefinition = {
  id: "sarah-jenkins",
  label: "Sarah Jenkins",
  shortLabel: "Sarah J.",
  journeys: [AGENTIC_CJM_JOURNEY, TRADITIONAL_CJM_JOURNEY],
  journeyHooks: {
    shouldSkipBeat: (beat, { headerLoggedIn }) =>
      shouldSkipTraditionalLoginBeat(beat, headerLoggedIn),
  },
};
