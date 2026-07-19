import { createElement, type ReactNode } from "react";
import { createRoot, type Root } from "react-dom/client";
import { classifyRuntimeError } from "@/app/shell/classifyRuntimeError";
import { StudioFatalErrorScreen } from "@/app/shell/StudioFatalErrorScreen";

let reactRoot: Root | null = null;

function ensureStudioRoot(): HTMLElement | null {
  return document.getElementById("root");
}

function mountStudioRoot(node: ReactNode): void {
  const rootEl = ensureStudioRoot();
  if (!rootEl) return;
  if (!reactRoot) reactRoot = createRoot(rootEl);
  reactRoot.render(node);
}

export function renderStudioRoot(node: ReactNode): void {
  mountStudioRoot(node);
}

/** Replace the studio viewport with the fatal error card (bootstrap or dev HMR). */
export function showStudioFatalError(
  error: unknown,
  componentStack?: string | null
): void {
  const rootEl = ensureStudioRoot();
  if (!rootEl) return;

  try {
    mountStudioRoot(
      createElement(StudioFatalErrorScreen, {
        error,
        componentStack,
        hint: classifyRuntimeError(error),
      })
    );
  } catch {
    showStudioFatalErrorHtml(rootEl, error);
  }
}

/** Fallback when React itself cannot mount. */
export function showStudioFatalErrorHtml(root: HTMLElement, error: unknown): void {
  const hint = classifyRuntimeError(error);
  const details = error instanceof Error ? error.stack ?? error.message : String(error);
  root.innerHTML = [
    `<div style="font-family:system-ui,sans-serif;padding:24px;max-width:640px;margin:0 auto">`,
    `<h1 style="color:#012169;margin:0 0 8px">${hint.title}</h1>`,
    `<p>${hint.summary}</p>`,
    `<pre style="white-space:pre-wrap;background:#f5f5f5;padding:12px;border-radius:8px;font-size:12px">`,
    details.replace(/</g, "&lt;"),
    `</pre></div>`,
    `<p style="margin-top:16px"><button type="button" onclick="location.reload()" style="padding:8px 16px;cursor:pointer">Reload page</button></p>`,
    `</div>`,
  ].join("");
}
