import { ProtoAppErrorBoundary, renderBootstrapError } from "@/app/shell/ProtoAppErrorBoundary";
import { renderStudioRoot } from "@/app/shell/protoStudioFatalError";
import "./styles/index.css";

async function boot(): Promise<void> {
  const root = document.getElementById("root");
  if (!root) return;

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
