import { Component, type ErrorInfo, type ReactNode } from "react";
import { StudioFatalErrorScreen } from "@/app/shell/StudioFatalErrorScreen";
import {
  showStudioFatalError,
  showStudioFatalErrorHtml,
} from "@/app/shell/studioFatalError";

type Props = {
  children: ReactNode;
};

type State = {
  error: Error | null;
  componentStack: string | null;
};

export { StudioFatalErrorScreen } from "@/app/shell/StudioFatalErrorScreen";

/** Catches render errors in the React tree and shows a readable studio fallback. */
export class StudioAppErrorBoundary extends Component<Props, State> {
  state: State = { error: null, componentStack: null };

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { error };
  }

  componentDidCatch(_error: Error, info: ErrorInfo): void {
    this.setState({ componentStack: info.componentStack });
  }

  render(): ReactNode {
    if (this.state.error) {
      return (
        <StudioFatalErrorScreen
          error={this.state.error}
          componentStack={this.state.componentStack}
        />
      );
    }
    return this.props.children;
  }
}

/** Bootstrap path when App (or its imports) fail before React mounts. */
export function renderBootstrapError(root: HTMLElement, error: unknown): void {
  try {
    showStudioFatalError(error);
  } catch {
    showStudioFatalErrorHtml(root, error);
  }
}
