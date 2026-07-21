import type { PersonaDefinition } from "@/projects/types";
import {
  SARAH_JENKINS_CJM_RECORDINGS,
  SARAH_JENKINS_CJMS,
  shouldSkipTraditionalLoginBeat,
} from "@/projects/boots-pharmacy/personas/sarah-jenkins/cjm";

export const SARAH_JENKINS_PERSONA: PersonaDefinition = {
  id: "sarah-jenkins",
  label: "Sarah Jenkins",
  shortLabel: "Sarah J.",
  journeys: SARAH_JENKINS_CJMS,
  journeyRecordings: SARAH_JENKINS_CJM_RECORDINGS,
  journeyHooks: {
    shouldSkipBeat: (beat, { headerLoggedIn }) =>
      shouldSkipTraditionalLoginBeat(beat, headerLoggedIn),
  },
};
