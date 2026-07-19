import { createRoot, type Root } from "react-dom/client";
import { HomeScreen, type HomeScreenProps } from "./HomeScreen";
import { HOME_REACT_SCREEN_ID, HOME_SCREEN_SELECTOR } from "./homeContract";

const HOST_CLASS = "studio-react-screen-host";
/** Keep Studio chrome mounts; retire every Make Frame child under Home. */
const KEEP_VISIBLE = new Set([HOST_CLASS, "proto-footer-mount", "proto-header-mount"]);

let root: Root | null = null;
let hostEl: HTMLElement | null = null;
/** Cancels a deferred unmount when remount wins the race (tab flip / Strict Mode). */
let unmountTimer: ReturnType<typeof setTimeout> | null = null;

function pageEl(): HTMLElement | null {
  return document.querySelector(HOME_SCREEN_SELECTOR);
}

function cancelDeferredUnmount(): void {
  if (unmountTimer != null) {
    clearTimeout(unmountTimer);
    unmountTimer = null;
  }
}

function ensureHost(page: HTMLElement): HTMLElement {
  let host = page.querySelector<HTMLElement>(`:scope > .${HOST_CLASS}`);
  if (!host) {
    host = document.createElement("div");
    host.className = HOST_CLASS;
    host.dataset.studioReactScreen = HOME_REACT_SCREEN_ID;
    const footer = page.querySelector<HTMLElement>(
      ":scope > .proto-footer-mount"
    );
    if (footer) page.insertBefore(host, footer);
    else page.appendChild(host);
  }
  hostEl = host;
  return host;
}

function hideMakeChrome(page: HTMLElement): void {
  Array.from(page.children).forEach((node) => {
    if (!(node instanceof HTMLElement)) return;
    const classList = node.classList;
    if (
      [...KEEP_VISIBLE].some((cls) => classList.contains(cls)) ||
      node.dataset.studioReactScreen === HOME_REACT_SCREEN_ID
    ) {
      return;
    }
    node.style.display = "none";
    node.dataset.studioMakeRetired = HOME_REACT_SCREEN_ID;
  });
  page.dataset.studioReactScreen = HOME_REACT_SCREEN_ID;
}

function restoreMakeChrome(page: HTMLElement): void {
  page
    .querySelectorAll<HTMLElement>(
      `[data-studio-make-retired="${HOME_REACT_SCREEN_ID}"]`
    )
    .forEach((el) => {
      el.style.removeProperty("display");
      delete el.dataset.studioMakeRetired;
    });
  delete page.dataset.studioReactScreen;
}

/** True when Home Make wire has been retired for the React migration. */
export function isHomeReactMounted(): boolean {
  return !!pageEl()?.dataset.studioReactScreen;
}

export function mountHomeScreen(props: HomeScreenProps): void {
  cancelDeferredUnmount();
  const page = pageEl();
  if (!page) return;

  hideMakeChrome(page);
  const host = ensureHost(page);
  if (!root) root = createRoot(host);
  root.render(<HomeScreen {...props} />);
}

/**
 * Tear down the createRoot host. Must not call `root.unmount()` synchronously
 * during a parent React render/commit (useLayoutEffect) — defer to macrotask.
 */
export function unmountHomeScreen(): void {
  if (unmountTimer != null) return;
  if (!root && !hostEl) {
    const page = pageEl();
    if (page) restoreMakeChrome(page);
    return;
  }

  const page = pageEl();
  if (page) delete page.dataset.studioReactScreen;

  unmountTimer = setTimeout(() => {
    unmountTimer = null;
    const r = root;
    const h = hostEl;
    root = null;
    hostEl = null;
    r?.unmount();
    h?.remove();
    if (page) restoreMakeChrome(page);
  }, 0);
}
