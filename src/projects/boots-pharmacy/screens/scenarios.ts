import type { ScenarioScreenConfig } from "@/app/scenario/scenarioEngine";

/** Boots Pharmacy — frame-step scenario configs (engine lives in shell). */
export const BOOTS_PHARMACY_SCENARIO_SCREENS: ScenarioScreenConfig[] = [
  {
    id: "site-pilot-chat",
    label: "Chat experience",
    childIndex: 10,
    minVisibleFrames: 1,
    playbackStepMs: 2000,
  },
];
