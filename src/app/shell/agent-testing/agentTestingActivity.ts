/** Live activity line for the agent-testing overlay (PO mid-flight pulse). */

export type AgentTestingActivityPhase =
  | "idle"
  | "preparing"
  | "running"
  | "waiting"
  | "settling";

export function formatActivityStatus(
  phase: AgentTestingActivityPhase,
  detail?: string
): string {
  const trimmed = detail?.trim();
  switch (phase) {
    case "preparing":
      return trimmed ? `Preparing… ${trimmed}` : "Preparing…";
    case "running":
      return trimmed ? `Running… ${trimmed}` : "Running script…";
    case "waiting":
      return trimmed ? `Waiting… ${trimmed}` : "Waiting…";
    case "settling":
      return trimmed ? `Settling… ${trimmed}` : "Settling sitrep…";
    default:
      return trimmed || "Idle";
  }
}
