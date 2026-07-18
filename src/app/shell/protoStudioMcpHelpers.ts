/** Dev-only helpers for Chrome DevTools MCP / agent live testing. */

import type { ProtoOrchestraModeId } from "@/app/orchestra/types";
import { logControlPanel } from "@/app/shell/protoControlPanelLog";

export type ProtoStudioMcpState = {
  diagnosticOpen: boolean;
  journeyMode: boolean;
  scrollLock: boolean;
  orchestraMode: ProtoOrchestraModeId | null;
  label: string | null;
  counter: string | null;
  logLen: number;
};

export type ProtoSmokeRetreatCheck = {
  id: string;
  pass: boolean;
  detail?: string;
};

export type ProtoSmokeRetreatResult = {
  pass: boolean;
  checks: ProtoSmokeRetreatCheck[];
};

declare global {
  interface Window {
    /** Dismiss playback diagnostic overlay if open. Returns whether one was open. */
    __protoDismissPlaybackDiagnostic?: () => boolean;
    /** Snapshot for MCP scripts — no paste needed. */
    __protoStudioState?: () => ProtoStudioMcpState;
    /** Dismiss diagnostic then return clean state. */
    __protoEnsureCleanStudio?: () => ProtoStudioMcpState;
    /** Programmatically switch Agentic / Traditional CJM path. */
    __protoSetOrchestraMode?: (modeId: ProtoOrchestraModeId) => boolean;
    /** Lightweight retreat baseline checks for MCP smoke runs. */
    __protoSmokeRetreatChecks?: () => ProtoSmokeRetreatResult;
  }
}

const ORCHESTRA_MODE_IDS: ProtoOrchestraModeId[] = [
  "agentic-cjm",
  "traditional-cjm",
];

function journeyModeSwitch(): HTMLElement | null {
  return document.querySelector<HTMLElement>(
    '[role="switch"][aria-label="Journey mode"]'
  );
}

function runSmokeRetreatChecks(): ProtoSmokeRetreatResult {
  const checks: ProtoSmokeRetreatCheck[] = [];

  const journeySwitch = journeyModeSwitch();
  checks.push({
    id: "journey-switch-present",
    pass: journeySwitch != null,
    detail: journeySwitch ? undefined : "Missing role=switch Journey mode control",
  });

  const duplicateJourneyLabels = Array.from(
    document.querySelectorAll<HTMLElement>('[aria-label="Journey mode"]')
  ).filter((el) => el.getAttribute("role") !== "switch");
  checks.push({
    id: "orchestra-mode-label-unique",
    pass: duplicateJourneyLabels.length === 0,
    detail:
      duplicateJourneyLabels.length === 0
        ? undefined
        : `Found ${duplicateJourneyLabels.length} non-switch controls labeled Journey mode`,
  });

  let stateReadable = false;
  try {
    stateReadable = typeof window.__protoStudioState === "function";
  } catch {
    stateReadable = false;
  }
  checks.push({
    id: "mcp-state-readable",
    pass: stateReadable,
  });

  checks.push({
    id: "set-orchestra-mode-helper",
    pass: typeof window.__protoSetOrchestraMode === "function",
  });

  return {
    pass: checks.every((check) => check.pass),
    checks,
  };
}

export function registerProtoStudioMcpHelpers(options: {
  dismissDiagnostic: () => void;
  isDiagnosticOpen: () => boolean;
  getState: () => Omit<
    ProtoStudioMcpState,
    "diagnosticOpen" | "logLen" | "orchestraMode"
  >;
  getOrchestraModeId?: () => ProtoOrchestraModeId;
  setOrchestraMode?: (modeId: ProtoOrchestraModeId) => void;
}): () => void {
  if (typeof window === "undefined") return () => {};

  window.__protoDismissPlaybackDiagnostic = () => {
    if (!options.isDiagnosticOpen()) return false;
    logControlPanel("diagnostic:dismiss", { source: "mcp-helper" });
    options.dismissDiagnostic();
    return true;
  };

  window.__protoStudioState = () => {
    const base = options.getState();
    return {
      ...base,
      orchestraMode: options.getOrchestraModeId?.() ?? null,
      diagnosticOpen: options.isDiagnosticOpen(),
      logLen: window.__protoControlPanelLog?.length ?? 0,
    };
  };

  window.__protoEnsureCleanStudio = () => {
    window.__protoDismissPlaybackDiagnostic?.();
    return window.__protoStudioState!();
  };

  window.__protoSetOrchestraMode = (modeId) => {
    if (!ORCHESTRA_MODE_IDS.includes(modeId)) return false;
    if (!options.setOrchestraMode) return false;
    logControlPanel("studio:orchestra-mode", { source: "mcp-helper", to: modeId });
    options.setOrchestraMode(modeId);
    return true;
  };

  window.__protoSmokeRetreatChecks = runSmokeRetreatChecks;

  return () => {
    delete window.__protoDismissPlaybackDiagnostic;
    delete window.__protoStudioState;
    delete window.__protoEnsureCleanStudio;
    delete window.__protoSetOrchestraMode;
    delete window.__protoSmokeRetreatChecks;
  };
}
