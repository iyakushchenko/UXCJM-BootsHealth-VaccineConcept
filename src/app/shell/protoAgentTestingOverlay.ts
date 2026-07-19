/**
 * Compact bottom-right agent-testing status panel.
 * Invisible full-viewport capture blocks page clicks; page stays visible.
 *
 *   window.__protoAgentTestingOverlay?.start()
 *   window.__protoAgentTestingOverlay?.touch() // arm if inactive (no nest bump)
 *   window.__protoAgentTestingOverlay?.log("clicked Book Step 2")
 *   window.__protoAgentTestingOverlay?.stop() // nest-aware; no reload
 *   window.__protoAgentTestingOverlay?.stop({ force: true, reload: true })
 *
 * MCP helpers should call stop({ reload: true }) so the PO gets a clean tab.
 * Manual console experiments default to reload: false.
 * Ephemeral `?proof=*` (and friends) are stripped on install + stop.
 */

import { stripEphemeralStudioQuery } from "@/app/shell/protoStudioUrl";

const ROOT_ID = "proto-agent-testing-overlay";
const LOG_LIMIT = 80;
/** Safety: never leave the overlay up longer than this. */
const MAX_MS = 3 * 60 * 1000;
/** Stale persist key — cleared on stop; never restored on load by default. */
const PERSIST_KEY = "protoAgentTestingOverlay";
const CONTINUE_KEY = "protoAgentTestingOverlayContinue";

export type StopAgentTestingOverlayOptions = {
  force?: boolean;
  /** After teardown, reload once. MCP helpers: true. Manual: false (default). */
  reload?: boolean;
};

type OverlayApi = {
  start: (title?: string) => void;
  /** Arm overlay if inactive; refresh safety timer if already active. Never nests. */
  touch: (title?: string) => void;
  stop: (options?: StopAgentTestingOverlayOptions) => void;
  log: (line: string) => void;
  isActive: () => boolean;
};

let active = false;
let logLines: string[] = [];
let nest = 0;
let safetyTimer: ReturnType<typeof setTimeout> | null = null;
let beforeUnloadBound = false;
let reloadPending = false;

function clearPersist(): void {
  try {
    sessionStorage.removeItem(PERSIST_KEY);
  } catch {
    /* private mode / SSR */
  }
}

function writePersist(title: string): void {
  try {
    sessionStorage.setItem(
      PERSIST_KEY,
      JSON.stringify({ title, at: Date.now() })
    );
  } catch {
    /* ignore */
  }
}

function shouldContinueFromPersist(): boolean {
  try {
    return sessionStorage.getItem(CONTINUE_KEY) === "1";
  } catch {
    return false;
  }
}

function clearSafetyTimer(): void {
  if (safetyTimer != null) {
    clearTimeout(safetyTimer);
    safetyTimer = null;
  }
}

function armSafetyTimer(): void {
  clearSafetyTimer();
  safetyTimer = setTimeout(() => {
    logAgentTestingOverlay("overlay auto-stop: safety timeout");
    stopAgentTestingOverlay({ force: true, reload: false });
  }, MAX_MS);
}

function onBeforeUnload(): void {
  if (!active) return;
  nest = 0;
  active = false;
  clearSafetyTimer();
  clearPersist();
}

function bindBeforeUnload(): void {
  if (beforeUnloadBound || typeof window === "undefined") return;
  if (typeof window.addEventListener !== "function") return;
  window.addEventListener("beforeunload", onBeforeUnload);
  beforeUnloadBound = true;
}

function unbindBeforeUnload(): void {
  if (!beforeUnloadBound || typeof window === "undefined") return;
  if (typeof window.removeEventListener === "function") {
    window.removeEventListener("beforeunload", onBeforeUnload);
  }
  beforeUnloadBound = false;
}

function ensureRoot(): HTMLElement | null {
  if (typeof document === "undefined") return null;
  let root = document.getElementById(ROOT_ID);
  if (root) return root;

  root = document.createElement("div");
  root.id = ROOT_ID;
  root.className = "proto-agent-testing-overlay";
  root.setAttribute("aria-live", "polite");
  root.innerHTML = `
    <div class="proto-agent-testing-overlay__capture" aria-hidden="true"></div>
    <div class="proto-agent-testing-overlay__panel" role="status">
      <div class="proto-agent-testing-overlay__header">
        <p class="proto-agent-testing-overlay__title">AGENT TESTING</p>
        <button type="button" class="proto-agent-testing-overlay__dismiss">Dismiss</button>
      </div>
      <p class="proto-agent-testing-overlay__hint">Page visible — clicks blocked. Status log below.</p>
      <ol class="proto-agent-testing-overlay__log"></ol>
    </div>
  `;
  const dismiss = root.querySelector<HTMLButtonElement>(
    ".proto-agent-testing-overlay__dismiss"
  );
  dismiss?.addEventListener("click", () => {
    stopAgentTestingOverlay({ force: true, reload: false });
  });
  document.documentElement.appendChild(root);
  return root;
}

function renderLog(): void {
  if (typeof document === "undefined") return;
  const root = document.getElementById(ROOT_ID);
  const list = root?.querySelector<HTMLOListElement>(
    ".proto-agent-testing-overlay__log"
  );
  if (!list) return;
  list.replaceChildren();
  for (const line of logLines) {
    const li = document.createElement("li");
    li.textContent = line;
    list.appendChild(li);
  }
  list.scrollTop = list.scrollHeight;
}

function setTitle(title: string): void {
  if (typeof document === "undefined") return;
  const el = document.querySelector<HTMLElement>(
    ".proto-agent-testing-overlay__title"
  );
  if (el) el.textContent = title;
}

function stamp(line: string): string {
  const t = new Date().toLocaleTimeString("en-GB", { hour12: false });
  return `${t}  ${line}`;
}

function teardownDom(): void {
  if (typeof document === "undefined") return;
  const root = document.getElementById(ROOT_ID);
  if (root) root.dataset.active = "false";
  delete document.documentElement.dataset.protoAgentTesting;
}

function scheduleReload(): void {
  if (reloadPending || typeof window === "undefined") return;
  reloadPending = true;
  // Defer so MCP evaluate_script can return the run result before navigation.
  window.setTimeout(() => {
    window.location.reload();
  }, 120);
}

export function startAgentTestingOverlay(title?: string): void {
  nest += 1;
  active = true;
  const resolved = title?.trim() || "AGENT TESTING";
  const root = ensureRoot();
  if (root) root.dataset.active = "true";
  if (typeof document !== "undefined") {
    document.documentElement.dataset.protoAgentTesting = "true";
  }
  setTitle(resolved);
  writePersist(resolved);
  bindBeforeUnload();
  armSafetyTimer();
  if (nest === 1) {
    logLines = [];
    logAgentTestingOverlay("overlay start");
  }
}

export function stopAgentTestingOverlay(
  options?: StopAgentTestingOverlayOptions
): void {
  if (options?.force) nest = 0;
  else nest = Math.max(0, nest - 1);
  if (nest > 0) return;

  if (active) logAgentTestingOverlay("overlay stop");
  active = false;
  clearSafetyTimer();
  clearPersist();
  unbindBeforeUnload();
  teardownDom();
  stripEphemeralStudioQuery();

  if (options?.reload) scheduleReload();
}

/**
 * Ensure the BR panel is visible while an agent drives the tab.
 * Safe to call on every helper / DevTools evaluate — does not bump nest.
 */
export function touchAgentTestingOverlay(title?: string): void {
  if (active) {
    armSafetyTimer();
    if (title?.trim()) setTitle(title.trim());
    return;
  }
  startAgentTestingOverlay(title);
}

export function logAgentTestingOverlay(line: string): void {
  if (!active) return;
  logLines.push(stamp(line));
  if (logLines.length > LOG_LIMIT) {
    logLines = logLines.slice(-LOG_LIMIT);
  }
  renderLog();
}

export function isAgentTestingOverlayActive(): boolean {
  return active;
}

/**
 * On install: never restore a stale "testing" flag unless an explicit
 * continue key is set (default: never). Clear orphan persist otherwise.
 */
export function installAgentTestingOverlayApi(): void {
  if (typeof window === "undefined") return;

  stripEphemeralStudioQuery();

  if (!shouldContinueFromPersist()) {
    clearPersist();
    // Orphan DOM from a hard refresh / HMR — do not leave it active.
    if (
      typeof document !== "undefined" &&
      typeof document.getElementById === "function"
    ) {
      const orphan = document.getElementById(ROOT_ID);
      if (orphan) {
        orphan.dataset.active = "false";
        delete document.documentElement.dataset.protoAgentTesting;
      }
    }
    nest = 0;
    active = false;
  }

  const api: OverlayApi = {
    start: startAgentTestingOverlay,
    touch: touchAgentTestingOverlay,
    stop: (options) => stopAgentTestingOverlay(options),
    log: logAgentTestingOverlay,
    isActive: isAgentTestingOverlayActive,
  };
  window.__protoAgentTestingOverlay = api;
}

export function uninstallAgentTestingOverlayApi(): void {
  nest = 0;
  active = false;
  logLines = [];
  reloadPending = false;
  clearSafetyTimer();
  clearPersist();
  unbindBeforeUnload();
  if (typeof document !== "undefined") {
    document.getElementById(ROOT_ID)?.remove();
    delete document.documentElement.dataset.protoAgentTesting;
  }
  if (typeof window !== "undefined") {
    delete window.__protoAgentTestingOverlay;
  }
}

declare global {
  interface Window {
    __protoAgentTestingOverlay?: OverlayApi;
  }
}
