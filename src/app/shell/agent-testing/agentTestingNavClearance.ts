/**
 * Agent-testing capture lives on document.body above #root.
 * Clear the Studio nav band so Step/Play/REC stay clickable.
 */

export const AGENT_TESTING_NAV_CLEARANCE_VAR =
  "--studio-agent-testing-nav-clearance";

let navClearanceBound = false;

export function syncAgentTestingNavClearance(
  overlayRootId: string,
  root?: HTMLElement | null
): void {
  if (typeof document === "undefined") return;
  const overlay = root ?? document.getElementById(overlayRootId);
  if (!overlay) return;
  const nav = document.querySelector<HTMLElement>(".studio-nav-panel-host");
  const bottom = nav ? Math.ceil(nav.getBoundingClientRect().bottom) : 0;
  overlay.style.setProperty(
    AGENT_TESTING_NAV_CLEARANCE_VAR,
    `${Math.max(0, bottom)}px`
  );
}

export function bindAgentTestingNavClearance(overlayRootId: string): void {
  if (navClearanceBound || typeof window === "undefined") return;
  navClearanceBound = true;
  const sync = () => syncAgentTestingNavClearance(overlayRootId);
  window.addEventListener("resize", sync, { passive: true });
  window.visualViewport?.addEventListener("resize", sync, { passive: true });
}
