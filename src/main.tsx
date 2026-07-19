import { StudioAppErrorBoundary, renderBootstrapError } from "@/app/shell/StudioAppErrorBoundary";
import { renderStudioRoot } from "@/app/shell/studioFatalError";
import { stripEphemeralStudioQuery } from "@/app/shell/studioUrl";
import "./styles/index.css";

async function boot(): Promise<void> {
  const root = document.getElementById("root");
  if (!root) return;

  // Drop agent leftovers (`?proof=*`, …) before React mounts.
  stripEphemeralStudioQuery();

  try {
    const { default: App } = await import("./app/App.tsx");
    renderStudioRoot(
      <StudioAppErrorBoundary>
        <App />
      </StudioAppErrorBoundary>
    );
  } catch (error) {
    renderBootstrapError(root, error);
  }
}

void boot();
