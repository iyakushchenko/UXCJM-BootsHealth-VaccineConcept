/**
 * Studio session auth flag — single source of truth for logged-in state.
 *
 * Used by Boots header chrome, PDP CTA branching, Availability Tool hearts,
 * journey skip hooks, and MCP probes. Prefer `__studioIsLoggedIn` /
 * `__studioSetLoggedIn` in console; `__proto*` aliases mirror the same fns.
 */

type StudioAuthListener = (loggedIn: boolean) => void;

let loggedIn = false;
const listeners = new Set<StudioAuthListener>();

export function isStudioLoggedIn(): boolean {
  return loggedIn;
}

export function setStudioLoggedIn(next: boolean): void {
  if (loggedIn === next) return;
  loggedIn = next;
  for (const listener of listeners) {
    try {
      listener(loggedIn);
    } catch {
      /* ignore subscriber errors */
    }
  }
}

/** Subscribe to auth changes. Returns unsubscribe. */
export function subscribeStudioLoggedIn(
  listener: StudioAuthListener
): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function installStudioAuthSessionWindowApi(): () => void {
  if (typeof window === "undefined") return () => {};

  const get = () => isStudioLoggedIn();
  const set = (next?: unknown) => {
    setStudioLoggedIn(Boolean(next));
    return isStudioLoggedIn();
  };

  window.__studioIsLoggedIn = get;
  window.__protoIsLoggedIn = get;
  window.__studioSetLoggedIn = set;
  window.__protoSetLoggedIn = set;

  return () => {
    delete window.__studioIsLoggedIn;
    delete window.__protoIsLoggedIn;
    delete window.__studioSetLoggedIn;
    delete window.__protoSetLoggedIn;
  };
}

declare global {
  interface Window {
    __studioIsLoggedIn?: () => boolean;
    __protoIsLoggedIn?: () => boolean;
    __studioSetLoggedIn?: (next?: unknown) => boolean;
    __protoSetLoggedIn?: (next?: unknown) => boolean;
  }
}
