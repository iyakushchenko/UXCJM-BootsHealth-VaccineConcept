import type { ProjectContentDefinition } from "@/projects/types";

/** Honest zero-page content contract. Never borrow another project's pages. */
export const EMPTY_PROJECT_CONTENT: ProjectContentDefinition = {
  PROJECT_SCREENS: [],
  HUB_LABEL: "Project",
  SCENARIO_SCREENS: [],
  studioTabToIndex: () => 0,
};
