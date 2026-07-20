/**
 * Two agent CONTROL kinds — not a third sessionKind.
 * Aligns with existing sessionKind=agent + CJM on/off.
 *
 * - playback — CJM/Play/SF/director cassette on-air (journey transport)
 * - manual  — agent QA latch without cassette (CJM off / free exploration)
 *
 * Do not confuse with sessionKind "manual" (bug-icon free logger).
 */

import type { AgentTestingSessionKind } from "@/app/shell/agent-testing/agentTestingSession";

export type AgentControlKind = "playback" | "manual";

export type DeriveAgentControlKindInput = {
  sessionKind: AgentTestingSessionKind;
  /** True when Studio journeyMode / CJM is on (cassette). */
  cjmOn: boolean;
};

/** null when not in agent CONTROL (manual logger / observe / idle). */
export function deriveAgentControlKind(
  input: DeriveAgentControlKindInput
): AgentControlKind | null {
  if (input.sessionKind !== "agent") return null;
  return input.cjmOn ? "playback" : "manual";
}

/** Short suffix for AGENT — CONTROL label. */
export function formatAgentControlKindSuffix(
  kind: AgentControlKind | null | undefined
): string {
  if (kind === "playback") return " · PLAYBACK";
  if (kind === "manual") return " · MANUAL";
  return "";
}

/** True when sitrep/cjm string means cassette on. */
export function isCjmCassetteOn(cjm: string | null | undefined): boolean {
  if (!cjm) return false;
  const v = cjm.trim().toLowerCase();
  if (!v || v === "off" || v === "hub") return false;
  return true;
}
