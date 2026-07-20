/**
 * Lean QA diag gate — open-world logger latch.
 * PLAYBACK_DIAG console emit only while gate is open.
 * Persist: sessionStorage gate flag + capped event ring.
 *
 * State lives on `window` so Vite HMR / duplicate module graphs
 * cannot fork open vs closed (quiet console vs loud).
 */

export const QA_DIAG_GATE_STORAGE_KEY = "studioQaDiagGate";
export const QA_DIAG_RING_STORAGE_KEY = "studioQaDiagRing";
export const QA_DIAG_RING_MAX = 300;

export type QaDiagRingEvent = {
  kind: string;
  text?: string;
  atMs: number;
  atIso?: string;
  beatId?: string | null;
  screenId?: string | null;
  detail?: string;
  /** Overlay log row echo */
  label?: string;
};

type GatePersist = {
  open: boolean;
  logger?: boolean;
  updatedAt: number;
};

type GateMemory = {
  open: boolean;
  logger: boolean;
  ring: QaDiagRingEvent[];
};

const MEMORY_KEY = "__studioQaDiagGateMemory";

const listeners = new Set<(open: boolean) => void>();

function memory(): GateMemory {
  if (typeof window === "undefined") {
    // SSR / vitest without window — module-local fallback
    const g = globalThis as typeof globalThis & {
      [MEMORY_KEY]?: GateMemory;
    };
    if (!g[MEMORY_KEY]) {
      g[MEMORY_KEY] = { open: false, logger: false, ring: [] };
    }
    return g[MEMORY_KEY]!;
  }
  const w = window as Window & { [MEMORY_KEY]?: GateMemory };
  if (!w[MEMORY_KEY]) {
    w[MEMORY_KEY] = { open: false, logger: false, ring: [] };
  }
  return w[MEMORY_KEY]!;
}

function nowMs(): number {
  return typeof performance !== "undefined" && performance.now
    ? performance.now()
    : Date.now();
}

function readPersist(): GatePersist | null {
  try {
    const raw = sessionStorage.getItem(QA_DIAG_GATE_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as GatePersist;
    if (!parsed || typeof parsed.open !== "boolean") return null;
    return parsed;
  } catch {
    return null;
  }
}

function writePersist(): void {
  try {
    const m = memory();
    const payload: GatePersist = {
      open: m.open,
      logger: m.logger,
      updatedAt: Date.now(),
    };
    sessionStorage.setItem(QA_DIAG_GATE_STORAGE_KEY, JSON.stringify(payload));
  } catch {
    /* private mode */
  }
}

function writeRing(): void {
  try {
    const m = memory();
    sessionStorage.setItem(
      QA_DIAG_RING_STORAGE_KEY,
      JSON.stringify(m.ring.slice(-QA_DIAG_RING_MAX))
    );
  } catch {
    /* ignore quota */
  }
}

function readRing(): QaDiagRingEvent[] {
  try {
    const raw = sessionStorage.getItem(QA_DIAG_RING_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (e): e is QaDiagRingEvent =>
        !!e &&
        typeof e === "object" &&
        typeof (e as QaDiagRingEvent).kind === "string" &&
        typeof (e as QaDiagRingEvent).atMs === "number"
    );
  } catch {
    return [];
  }
}

function notify(): void {
  const open = memory().open;
  for (const fn of listeners) {
    try {
      fn(open);
    } catch {
      /* ignore */
    }
  }
}

/** Call once on boot — restores gate + ring from sessionStorage. */
export function hydrateQaDiagGate(): {
  open: boolean;
  logger: boolean;
  ring: QaDiagRingEvent[];
} {
  const persist = readPersist();
  const m = memory();
  m.ring = readRing().slice(-QA_DIAG_RING_MAX);
  m.open = persist?.open === true;
  m.logger = persist?.logger === true && m.open;
  return { open: m.open, logger: m.logger, ring: [...m.ring] };
}

export function isQaDiagGateOpen(): boolean {
  return memory().open;
}

export function isQaDiagLoggerMode(): boolean {
  const m = memory();
  return m.logger && m.open;
}

export function openQaDiagGate(options?: {
  logger?: boolean;
  reason?: string;
}): void {
  const m = memory();
  const nextLogger = options?.logger === true || m.logger;
  const changed = !m.open || m.logger !== nextLogger;
  m.open = true;
  m.logger = nextLogger;
  writePersist();
  if (changed) {
    appendQaDiagRing({
      kind: "gate-open",
      text: options?.reason ?? "open",
      atMs: nowMs(),
    });
    notify();
  }
}

export function closeQaDiagGate(options?: { reason?: string }): void {
  const m = memory();
  if (!m.open && !m.logger) return;
  appendQaDiagRing({
    kind: "gate-close",
    text: options?.reason ?? "close",
    atMs: nowMs(),
  });
  m.open = false;
  m.logger = false;
  writePersist();
  notify();
}

export function setQaDiagLoggerMode(on: boolean): void {
  const m = memory();
  m.logger = on && m.open;
  writePersist();
}

export function appendQaDiagRing(
  event: Omit<QaDiagRingEvent, "atMs" | "atIso"> & {
    atMs?: number;
    atIso?: string;
  }
): void {
  const atMs = event.atMs ?? nowMs();
  const full: QaDiagRingEvent = {
    ...event,
    atMs,
    atIso: event.atIso ?? new Date().toISOString(),
  };
  const m = memory();
  m.ring.push(full);
  if (m.ring.length > QA_DIAG_RING_MAX) {
    m.ring = m.ring.slice(-QA_DIAG_RING_MAX);
  }
  writeRing();
}

export function getQaDiagRing(): QaDiagRingEvent[] {
  return [...memory().ring];
}

export function replaceQaDiagRing(events: QaDiagRingEvent[]): void {
  const m = memory();
  m.ring = events.slice(-QA_DIAG_RING_MAX);
  writeRing();
}

export function subscribeQaDiagGate(fn: (open: boolean) => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

/** Test-only reset. */
export function resetQaDiagGateForTests(): void {
  const m = memory();
  m.open = false;
  m.logger = false;
  m.ring = [];
  listeners.clear();
  try {
    sessionStorage.removeItem(QA_DIAG_GATE_STORAGE_KEY);
    sessionStorage.removeItem(QA_DIAG_RING_STORAGE_KEY);
  } catch {
    /* ignore */
  }
}
