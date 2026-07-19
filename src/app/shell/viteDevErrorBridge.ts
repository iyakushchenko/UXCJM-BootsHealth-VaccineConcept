import { showStudioFatalError } from "@/app/shell/studioFatalError";

type ViteErrorPayload = {
  err: {
    message: string;
    stack?: string;
    frame?: string;
    loc?: { file?: string; line?: number; column?: number };
  };
};

function vitePayloadToError(payload: ViteErrorPayload): Error {
  const parts = [payload.err.message.trim()];
  if (payload.err.frame?.trim()) {
    parts.push(payload.err.frame.trim());
  } else if (payload.err.stack?.trim()) {
    parts.push(payload.err.stack.trim());
  }
  const error = new Error(parts.join("\n\n"));
  error.name = "ViteTransformError";
  return error;
}

/**
 * Route Vite dev transform/HMR errors to the studio fatal-error card instead of
 * Vite's default overlay (requires `server.hmr.overlay: false` in vite.config).
 */
export function installProtoViteDevErrorBridge(): void {
  if (!import.meta.env.DEV || !import.meta.hot) return;

  import.meta.hot.on("vite:error", (payload: ViteErrorPayload) => {
    showStudioFatalError(vitePayloadToError(payload));
  });

  // When a dependency of main.tsx fails to compile, dynamic import rejects without
  // vite:error on some Vite versions — surface that through the same card.
  window.addEventListener("vite:preloadError", (event) => {
    event.preventDefault();
    const reason = (event as Event & { payload?: unknown }).payload ?? event;
    showStudioFatalError(
      reason instanceof Error
        ? reason
        : new Error(
            reason != null && typeof reason === "object" && "message" in reason
              ? String((reason as { message: unknown }).message)
              : "Failed to load a studio module — see dev server terminal."
          )
    );
  });
}
