/**
 * Boots → engine MCP probe contribution.
 * Engine owns resolve/run; project owns recipes. Do not add screen if/else in
 * `studioMcpPageProbe.ts` — register here instead.
 */

import { registerMcpPageProbeSteps } from "@/app/shell/mcpPageProbeRegistry";
import { appointmentDetailsMcpProbeSteps } from "./appointment-details/appointmentDetailsMcpProbeSteps";
import { appointmentHistoryMcpProbeSteps } from "./appointment-history/appointmentHistoryMcpProbeSteps";
import { chatMcpProbeSteps } from "./chat/chatMcpProbeSteps";
import { sitePilotMcpProbeSteps } from "./home/sitePilotMcpProbeSteps";

/** Idempotent overwrite — safe to import from project barrel + probe module. */
export function registerBootsMcpPageProbes(): void {
  registerMcpPageProbeSteps("site-pilot", sitePilotMcpProbeSteps);
  registerMcpPageProbeSteps("chat", chatMcpProbeSteps);
  registerMcpPageProbeSteps(
    "appointment-history",
    appointmentHistoryMcpProbeSteps
  );
  registerMcpPageProbeSteps(
    "appointment-details",
    appointmentDetailsMcpProbeSteps
  );
}

registerBootsMcpPageProbes();
