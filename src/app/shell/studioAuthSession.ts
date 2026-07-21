/**
 * Studio session auth flag — single source of truth for logged-in state.
 *
 * Used by Boots header chrome, PDP CTA branching, Availability Tool hearts,
 * journey skip hooks, and MCP probes. Prefer `__studioIsLoggedIn` /
 * `__studioSetLoggedIn` in console; `__proto*` aliases mirror the same fns.
 */

type StudioAuthListener = (loggedIn: boolean) => void;
type StudioAuthAuditListener = (loggedIn: boolean) => void;
const STUDIO_AUTH_SESSION_KEY = "studioAuthSessionV1";

function readPersistedAuth(): boolean {
  try {
    return sessionStorage.getItem(STUDIO_AUTH_SESSION_KEY) === "user";
  } catch {
    return false;
  }
}

function persistAuth(value: boolean): void {
  try {
    sessionStorage.setItem(STUDIO_AUTH_SESSION_KEY, value ? "user" : "guest");
  } catch {
    /* runtime auth remains authoritative */
  }
}

let loggedIn = typeof sessionStorage === "undefined" ? false : readPersistedAuth();
const listeners = new Set<StudioAuthListener>();
const auditListeners = new Set<StudioAuthAuditListener>();

export function isStudioLoggedIn(): boolean {
  return loggedIn;
}

export function setStudioLoggedIn(next: boolean): void {
  if (loggedIn === next) return;
  loggedIn = next;
  persistAuth(loggedIn);
  for (const listener of listeners) {
    try {
      listener(loggedIn);
    } catch {
      /* ignore subscriber errors */
    }
  }
  for (const listener of auditListeners) {
    try {
      listener(loggedIn);
    } catch {
      /* auth state remains authoritative if an audit observer fails */
    }
  }
}

/** Engine audit hook (REC metadata); product projects must not fork auth state. */
export function subscribeStudioAuthAudit(
  listener: StudioAuthAuditListener
): () => void {
  auditListeners.add(listener);
  return () => auditListeners.delete(listener);
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
