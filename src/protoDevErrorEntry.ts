/**
 * Loads before main.tsx so Vite transform errors still reach the studio error card
 * when the app entry fails to compile (overlay is disabled in vite.config).
 */
import { installProtoViteDevErrorBridge } from "@/app/shell/protoViteDevErrorBridge";

installProtoViteDevErrorBridge();
