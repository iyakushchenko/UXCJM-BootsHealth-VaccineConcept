import { Component, type ErrorInfo, type ReactNode } from "react";
import { ProtoFatalErrorScreen } from "@/app/shell/ProtoFatalErrorScreen";
import {
  showStudioFatalError,
  showStudioFatalErrorHtml,
} from "@/app/shell/protoStudioFatalError";

type Props = {
  children: ReactNode;
};

type State = {
  error: Error | null;
  componentStack: string | null;
};

export { ProtoFatalErrorScreen } from "@/app/shell/ProtoFatalErrorScreen";

/** Catches render errors in the React tree and shows a readable studio fallback. */
export class ProtoAppErrorBoundary extends Component<Props, State> {
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
        <ProtoFatalErrorScreen
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
