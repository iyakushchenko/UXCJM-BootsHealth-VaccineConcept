/**
 * Engine-owned MCP page-probe step registry.
 *
 * Projects register screen recipes at boot. The engine resolves by `screenId`
 * — pages must not patch `studioMcpPageProbe.ts` with new if/else imports.
 *
 *   registerMcpPageProbeSteps("appointment-history", appointmentHistoryMcpProbeSteps)
 */

export type McpPageProbeStep = {
  id: string;
  /** CSS selector relative to document. */
  selector: string;
  /**
   * click — robo-click (refuses if under overlay).
   * assert — presence / custom assert.
   * refuse-click — PASS only when overlay is open AND click is refused.
   * reveal — scroll prototype root to target (no click); proves below-fold visibility.
   * hover — robo-hover dwell + optional assert (CSS :hover may be rule-checked).
   */
  action?: "click" | "assert" | "refuse-click" | "reveal" | "hover";
  /** Optional assert after click / for assert-only steps. */
  assert?: () => boolean | string;
  /** Extra wait after click (ms) for loaders / reveal. */
  settleMs?: number;
  /** Poll assert until true or timeout (assert steps). */
  waitMs?: number;
  /**
   * When selector is missing, PASS with detail instead of FAIL.
   * Use sparingly for temporary optional bands — prefer hard FAIL once mounted.
   */
  softSkipIfMissing?: boolean;
  /** Detail logged when soft-skipping a missing selector. */
  softSkipDetail?: string;
};

export type McpPageProbeStepsFactory = () => McpPageProbeStep[];

const factories = new Map<string, McpPageProbeStepsFactory>();

/** Register (or replace) probe steps for a navigable `screenId`. */
export function registerMcpPageProbeSteps(
  screenId: string,
  factory: McpPageProbeStepsFactory
): void {
  const id = screenId.trim();
  if (!id) {
    throw new Error("registerMcpPageProbeSteps: screenId required");
  }
  factories.set(id, factory);
}

/** Resolve registered steps; null when this screen has no project recipe. */
export function resolveMcpPageProbeSteps(
  screenId: string
): McpPageProbeStep[] | null {
  const factory = factories.get(screenId);
  if (!factory) return null;
  return factory();
}

/** Test / diagnostics — registered screen ids. */
export function listRegisteredMcpPageProbeScreens(): string[] {
  return Array.from(factories.keys()).sort();
}

/** Test helper — clear all registrations. */
export function clearMcpPageProbeRegistryForTests(): void {
  factories.clear();
}
