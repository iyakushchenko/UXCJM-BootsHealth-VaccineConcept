import type { OrchestraModeOption, ProtoOrchestraModeId } from "@/app/orchestra/types";

export const PROTO_ORCHESTRA_DEFAULT_MODE: ProtoOrchestraModeId = "agentic-cjm";

export const PROTO_ORCHESTRA_MODE_OPTIONS: OrchestraModeOption[] = [
  { id: "agentic-cjm", label: "Agentic CJM" },
  { id: "traditional-cjm", label: "Traditional CJM" },
];

const MODE_STORAGE_KEY = "proto-orchestra-mode";

export function readStoredOrchestraMode(): ProtoOrchestraModeId {
  try {
    const raw = sessionStorage.getItem(MODE_STORAGE_KEY);
    if (raw === "chat-experience") return "agentic-cjm";
    if (raw === "agentic-cjm" || raw === "traditional-cjm") {
      return raw;
    }
  } catch {
    /* ignore */
  }
  return PROTO_ORCHESTRA_DEFAULT_MODE;
}

export function storeOrchestraMode(modeId: ProtoOrchestraModeId): void {
  try {
    sessionStorage.setItem(MODE_STORAGE_KEY, modeId);
  } catch {
    /* ignore */
  }
}
