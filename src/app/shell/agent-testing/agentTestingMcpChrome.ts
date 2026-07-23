/**
 * QA latch chrome paint — nav OBS/CTRL hint, Message diode+label, viewport border.
 * Live only when overlay is truly open (active + gate + visible). Never ghost.
 * Labels = in-app AGENT latch (not Cursor MCP).
 */

import {
  AGENT_LATCH_STATUS_TITLE,
  deriveMcpConnectionStatus,
  type McpConnectionStatus,
} from "@/app/shell/agent-testing/agentTestingMcpStatus";
import { peekQaAgentPresence } from "@/app/shell/agent-testing/agentTestingPresence";
import type { AgentTestingSessionKind } from "@/app/shell/agent-testing/agentTestingSession";
import type { AgentControlKind } from "@/app/shell/agent-testing/agentTestingControlKind";

export type McpChromeLiveInput = {
  active: boolean;
  settling: boolean;
  sessionKind: AgentTestingSessionKind;
  awaitingReply: boolean;
  agentControlKind?: AgentControlKind | null;
  gateOpen: boolean;
  overlayDomVisible: boolean;
  rootId: string;
};

export function isMcpChromeLive(input: {
  active: boolean;
  settling: boolean;
  gateOpen: boolean;
  overlayDomVisible: boolean;
}): boolean {
  return (
    input.active &&
    !input.settling &&
    input.gateOpen &&
    input.overlayDomVisible
  );
}

export function deriveLiveMcpStatus(input: McpChromeLiveInput): McpConnectionStatus {
  const live = isMcpChromeLive(input);
  return deriveMcpConnectionStatus({
    overlayActive: live,
    sessionKind: live ? input.sessionKind : "manual",
    awaitingReply: live ? input.awaitingReply : false,
    agentControlKind: live ? input.agentControlKind ?? null : null,
  });
}

/** Phases that read as "an agent session is actually live" — green icon. Error
 * is deliberately excluded (broken ≠ connected) even though it carries a label. */
const MCP_NAV_CONNECTED_PHASES = new Set([
  "connecting",
  "connected",
  "control",
  "observe",
  "pending",
]);

/**
 * mcp-server-stroke-rounded glyph — single source for the header nav chip
 * (StudioNavVersionChip.tsx, JSX) and this vanilla-DOM QA panel status row.
 * `currentColor` stroke — recolor via CSS `color`, never a raster asset.
 */
export const MCP_GLYPH_SVG_MARKUP =
  '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">' +
  '<path d="M3.49994 11.7501L11.6717 3.57855C12.7762 2.47398 14.5672 2.47398 15.6717 3.57855C16.7762 4.68312 16.7762 6.47398 15.6717 7.57855M15.6717 7.57855L9.49994 13.7501M15.6717 7.57855C16.7762 6.47398 18.5672 6.47398 19.6717 7.57855C20.7762 8.68312 20.7762 10.474 19.6717 11.5785L12.7072 18.543C12.3167 18.9335 12.3167 19.5667 12.7072 19.9572L13.9999 21.2499"></path>' +
  '<path d="M17.4999 9.74921L11.3282 15.921C10.2237 17.0255 8.43272 17.0255 7.32822 15.921C6.22373 14.8164 6.22373 13.0255 7.32822 11.921L13.4999 5.74939"></path>' +
  "</svg>";

/**
 * Honest, industry-plain status text for the QA panel row — deliberately
 * simpler than `formatMcpStatusLabel` (which stays as-is for the nav
 * tooltip / self-test assertions elsewhere). No internal jargon
 * ("MANUAL · ONLINE" concatenation) — just what's actually happening.
 */
function formatHonestMcpPanelText(phase: string): string {
  switch (phase) {
    case "connecting":
      return "Agent connecting via MCP…";
    case "connected":
      return "Agent connected via MCP";
    case "control":
      return "Agent connected via MCP. Mode: control";
    case "observe":
      return "Agent connected via MCP. Mode: observe";
    case "pending":
      return "Agent connected via MCP. Awaiting reply";
    case "error":
      return "Agent MCP connection error";
    case "stale":
      return "Agent disconnected (left)";
    default:
      return "Agent disconnected";
  }
}

/** Short, plain description of what each connected phase actually means —
 * for the hover tooltip / accessible name, one line, no internal jargon. */
function formatMcpPhaseDescription(phase: string): string {
  switch (phase) {
    case "connecting":
      return "starting the in-app QA session";
    case "connected":
      return "QA session ready";
    case "control":
      return "agent is driving the page";
    case "observe":
      return "agent is watching, not clicking";
    case "pending":
      return "waiting on your reply";
    case "error":
      return "session hit an error";
    case "stale":
      return "agent stopped interacting — session idle";
    default:
      return "no active QA session";
  }
}

/** Hover title for every MCP glyph — status + one-line description, always
 * disambiguated from Cursor's own DevTools MCP (never imply it's that). */
function formatMcpGlyphTitle(phase: string): string {
  return `${formatHonestMcpPanelText(phase)} — ${formatMcpPhaseDescription(phase)} (${AGENT_LATCH_STATUS_TITLE})`;
}

export function clearNavMcpHintDom(): void {
  if (typeof document === "undefined") return;
  if (typeof document.querySelector !== "function") return;
  const navHint = document.querySelector<HTMLElement>(
    ".studio-nav-version__mcp"
  );
  if (navHint?.dataset) {
    navHint.hidden = false;
    navHint.dataset.connected = "false";
    delete navHint.dataset.phase;
    navHint.title = formatMcpGlyphTitle("idle");
    navHint.setAttribute("aria-label", formatMcpGlyphTitle("idle"));
  }
  const glyph = document.querySelector<HTMLElement>(
    ".studio-agent-testing-overlay__mcp-glyph"
  );
  if (glyph?.dataset) {
    glyph.dataset.connected = "false";
    delete glyph.dataset.phase;
    glyph.title = formatMcpGlyphTitle("idle");
  }
  const panelText = document.querySelector<HTMLElement>(
    ".studio-agent-testing-overlay__mcp"
  );
  if (panelText?.dataset) {
    panelText.textContent = formatHonestMcpPanelText("idle");
    panelText.dataset.connected = "false";
    delete panelText.dataset.phase;
  }
  const html = document.documentElement;
  if (html?.dataset) {
    delete html.dataset.studioMcpStatus;
  }
}

/** Paint persistent glyph + honest text + nav hint + viewport border from live status. */
export function paintMcpChromeDom(
  input: McpChromeLiveInput,
  status: McpConnectionStatus
): void {
  if (typeof document === "undefined") return;
  if (typeof document.getElementById !== "function") return;

  const live = isMcpChromeLive(input);
  const root = document.getElementById(input.rootId);
  const wrap = root?.querySelector<HTMLElement>(
    ".studio-agent-testing-overlay__mcp-status"
  );
  let glyph = root?.querySelector<HTMLElement>(
    ".studio-agent-testing-overlay__mcp-glyph"
  );
  if (wrap && !glyph) {
    glyph = document.createElement("span");
    glyph.className = "studio-agent-testing-overlay__mcp-glyph";
    glyph.setAttribute("aria-hidden", "true");
    glyph.innerHTML = MCP_GLYPH_SVG_MARKUP;
    wrap.insertBefore(glyph, wrap.firstChild);
  }
  const chip = root?.querySelector<HTMLElement>(
    ".studio-agent-testing-overlay__mcp"
  );
  root
    ?.querySelectorAll(".studio-agent-testing-overlay__mcp-mode")
    .forEach((el) => el.remove());

  // Panel row is hidden in manual mode (no MCP relevance). In agent/observe
  // it's persistent — only the phase/connected state and honest text change.
  // `show` still gates the header title's richer label vs a plain idle fallback.
  const show = live && !!status.label && status.phase !== "idle";
  const presence = peekQaAgentPresence();
  const presenceAttr = presence.online
    ? "online"
    : presence.lastSeenAt > 0
      ? "stale"
      : "offline";
  // Green only when agent is ACTUALLY present (online) — no phase is
  // exempt. Stale/offline presence = silver, always. PO trust: no misleading
  // green flash on page reload / HMR from stale session persist.
  const panelConnected =
    live &&
    MCP_NAV_CONNECTED_PHASES.has(status.phase) &&
    presenceAttr === "online";
  if (wrap) {
    wrap.hidden = input.sessionKind === "manual";
  }
  // No presence = no "connected" anything. Degrade all live phases to idle
  // (offline) or stale when agent isn't actively touching.
  const panelEffectivePhase = show
    ? presenceAttr === "online"
      ? status.phase
      : presenceAttr === "stale"
        ? "stale"
        : "idle"
    : "idle";
  if (glyph) {
    glyph.dataset.connected = panelConnected ? "true" : "false";
    if (show) {
      glyph.dataset.phase = panelEffectivePhase;
      glyph.title = formatMcpGlyphTitle(panelEffectivePhase);
    } else {
      delete glyph.dataset.phase;
      glyph.title = formatMcpGlyphTitle("idle");
    }
  }
  if (chip) {
    chip.hidden = false;
    chip.dataset.connected = panelConnected ? "true" : "false";
    chip.textContent = formatHonestMcpPanelText(panelEffectivePhase);
    if (show) {
      chip.dataset.phase = panelEffectivePhase;
      chip.title = formatMcpGlyphTitle(panelEffectivePhase);
    } else {
      delete chip.dataset.phase;
      chip.title = formatMcpGlyphTitle("idle");
    }
  }
  if (root) {
    if (
      !show ||
      status.phase === "idle" ||
      (status.phase !== "control" &&
        status.phase !== "pending" &&
        status.phase !== "error")
    ) {
      delete root.dataset.mcp;
    } else {
      root.dataset.mcp = status.phase;
    }
  }
  const html = document.documentElement;
  if (html?.dataset) {
    if (!show) delete html.dataset.studioMcpStatus;
    else html.dataset.studioMcpStatus = status.phase;
  }
  const navHint = document.querySelector<HTMLElement>(
    ".studio-nav-version__mcp"
  );
  if (navHint) {
    // Icon persists always; only its color (via data-connected) and title change.
    // Same absolute rule as panel: green requires online presence, no exceptions.
    navHint.hidden = false;
    const navConnected =
      live &&
      MCP_NAV_CONNECTED_PHASES.has(status.phase) &&
      presenceAttr === "online";
    navHint.dataset.connected = navConnected ? "true" : "false";
    const effectivePhase = show
      ? presenceAttr === "online"
        ? status.phase
        : presenceAttr === "stale"
          ? "stale"
          : "idle"
      : "idle";
    const navTitle = formatMcpGlyphTitle(effectivePhase);
    navHint.title = navTitle;
    navHint.setAttribute("aria-label", navTitle);
    if (show) {
      navHint.dataset.phase = effectivePhase;
    } else {
      delete navHint.dataset.phase;
    }
  }
}
