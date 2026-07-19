import { ProtoAppErrorBoundary, renderBootstrapError } from "@/app/shell/ProtoAppErrorBoundary";
import { renderStudioRoot } from "@/app/shell/protoStudioFatalError";
import { stripEphemeralStudioQuery } from "@/app/shell/protoStudioUrl";
import "./styles/index.css";

async function boot(): Promise<void> {
  const root = document.getElementById("root");
  if (!root) return;

  // Drop agent leftovers (`?proof=*`, …) before React mounts.
  stripEphemeralStudioQuery();

  try {
    const { default: App } = await import("./app/App.tsx");
    renderStudioRoot(
      <ProtoAppErrorBoundary>
        <App />
      </ProtoAppErrorBoundary>
    );
  } catch (error) {
    renderBootstrapError(root, error);
  }
}

void boot();
