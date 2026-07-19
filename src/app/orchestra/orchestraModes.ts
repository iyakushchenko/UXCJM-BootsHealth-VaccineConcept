import type { OrchestraModeOption, OrchestraModeId } from "@/app/orchestra/types";

export const ORCHESTRA_DEFAULT_MODE: OrchestraModeId = "agentic-cjm";

export const ORCHESTRA_MODE_OPTIONS: OrchestraModeOption[] = [
  { id: "agentic-cjm", label: "Agentic CJM" },
  { id: "traditional-cjm", label: "Traditional CJM" },
];

const MODE_STORAGE_KEY = "proto-orchestra-mode";

export function readStoredOrchestraMode(): OrchestraModeId {
  try {
    const raw = sessionStorage.getItem(MODE_STORAGE_KEY);
    if (raw === "chat-experience") return "agentic-cjm";
    if (raw === "agentic-cjm" || raw === "traditional-cjm") {
      return raw;
    }
  } catch {
    /* ignore */
  }
  return ORCHESTRA_DEFAULT_MODE;
}

export function storeOrchestraMode(modeId: OrchestraModeId): void {
  try {
    sessionStorage.setItem(MODE_STORAGE_KEY, modeId);
  } catch {
    /* ignore */
  }
}
