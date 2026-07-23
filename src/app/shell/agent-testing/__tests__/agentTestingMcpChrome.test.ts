/**
 * @vitest-environment happy-dom
 */
import { describe, expect, it } from "vitest";
import {
  deriveLiveMcpStatus,
  isMcpChromeLive,
  paintMcpChromeDom,
  clearNavMcpHintDom,
} from "@/app/shell/agent-testing/agentTestingMcpChrome";
import { resetMcpStatusForTests } from "@/app/shell/agent-testing/agentTestingMcpStatus";
import { resetQaSessionForTests } from "@/app/shell/agent-testing/agentTestingSession";
import { touchQaAgentPresence, clearQaAgentPresence } from "@/app/shell/agent-testing/agentTestingPresence";

describe("agentTestingMcpChrome — no ghost OBS", () => {
  it("isMcpChromeLive requires active + gate + visible", () => {
    expect(
      isMcpChromeLive({
        active: true,
        settling: false,
        gateOpen: true,
        overlayDomVisible: true,
      })
    ).toBe(true);
    expect(
      isMcpChromeLive({
        active: false,
        settling: false,
        gateOpen: true,
        overlayDomVisible: true,
      })
    ).toBe(false);
    expect(
      isMcpChromeLive({
        active: true,
        settling: false,
        gateOpen: false,
        overlayDomVisible: true,
      })
    ).toBe(false);
    expect(
      isMcpChromeLive({
        active: true,
        settling: false,
        gateOpen: true,
        overlayDomVisible: false,
      })
    ).toBe(false);
  });

  it("closed overlay → idle status even if sessionKind was observe", () => {
    resetMcpStatusForTests();
    resetQaSessionForTests();
    const status = deriveLiveMcpStatus({
      active: false,
      settling: false,
      sessionKind: "observe",
      awaitingReply: false,
      gateOpen: false,
      overlayDomVisible: false,
      rootId: "agent-testing-overlay",
    });
    expect(status.phase).toBe("idle");
    expect(status.label).toBe("");
  });

  it("paint drops nav icon to disconnected (not hidden) when not live", () => {
    document.body.innerHTML =
      '<span class="studio-nav-version__mcp" data-phase="observe" data-connected="true"></span>' +
      '<div id="agent-testing-overlay"><div class="studio-agent-testing-overlay__mcp-status">' +
      '<span class="studio-agent-testing-overlay__mcp-glyph" data-phase="observe" data-connected="true"></span>' +
      '<span class="studio-agent-testing-overlay__mcp" data-phase="observe" data-connected="true">Agent connected via MCP. Mode: observe</span>' +
      "</div></div>";
    document.documentElement.dataset.studioMcpStatus = "observe";
    const input = {
      active: false,
      settling: false,
      sessionKind: "observe" as const,
      awaitingReply: false,
      gateOpen: false,
      overlayDomVisible: false,
      rootId: "agent-testing-overlay",
    };
    paintMcpChromeDom(input, deriveLiveMcpStatus(input));
    const hint = document.querySelector<HTMLElement>(".studio-nav-version__mcp");
    // Persistent glyph — never hidden, just falls back to muted/disconnected.
    expect(hint?.hidden).toBe(false);
    expect(hint?.dataset.connected).toBe("false");
    expect(hint?.dataset.phase).toBeUndefined();
    expect(document.documentElement.dataset.studioMcpStatus).toBeUndefined();
    // Panel row (bottom-right QA console) drops to the same honest idle text.
    const panelGlyph = document.querySelector<HTMLElement>(
      ".studio-agent-testing-overlay__mcp-glyph"
    );
    const panelText = document.querySelector<HTMLElement>(
      ".studio-agent-testing-overlay__mcp"
    );
    expect(panelGlyph?.hidden).toBeFalsy();
    expect(panelGlyph?.dataset.connected).toBe("false");
    expect(panelText?.hidden).toBeFalsy();
    expect(panelText?.dataset.connected).toBe("false");
    expect(panelText?.textContent).toBe("Agent disconnected");
    clearNavMcpHintDom();
    expect(hint?.hidden).toBe(false);
    expect(hint?.dataset.connected).toBe("false");
    expect(panelText?.textContent).toBe("Agent disconnected");
  });

  it("paint shows honest connected text + green glyph when live observe", () => {
    document.body.innerHTML =
      '<div id="agent-testing-overlay"><div class="studio-agent-testing-overlay__mcp-status">' +
      '<span class="studio-agent-testing-overlay__mcp-glyph"></span>' +
      '<span class="studio-agent-testing-overlay__mcp"></span>' +
      "</div></div>";
    touchQaAgentPresence("test");
    const input = {
      active: true,
      settling: false,
      sessionKind: "observe" as const,
      awaitingReply: false,
      gateOpen: true,
      overlayDomVisible: true,
      rootId: "agent-testing-overlay",
    };
    const status = deriveLiveMcpStatus(input);
    paintMcpChromeDom(input, status);
    const panelGlyph = document.querySelector<HTMLElement>(
      ".studio-agent-testing-overlay__mcp-glyph"
    );
    const panelText = document.querySelector<HTMLElement>(
      ".studio-agent-testing-overlay__mcp"
    );
    expect(panelText?.textContent).toBe("Agent connected via MCP. Mode: observe");
    expect(panelGlyph?.dataset.connected).toBe("true");
    expect(panelText?.dataset.connected).toBe("true");
  });
});
