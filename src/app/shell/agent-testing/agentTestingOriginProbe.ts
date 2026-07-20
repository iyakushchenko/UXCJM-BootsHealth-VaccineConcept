/**
 * Live origin probe for QA Session line: `Session: Localhost:5173 - Active`.
 */

export type StudioOriginLiveStatus = "active" | "offline" | "checking";

const MEMORY_KEY = "__studioQaOriginProbeMemory";
const PROBE_MS = 4_000;
const PROBE_TIMEOUT_MS = 2_500;

type Memory = {
  status: StudioOriginLiveStatus;
  hostLabel: string;
  timer: ReturnType<typeof setInterval> | null;
  inFlight: boolean;
  onUpdate: (() => void) | null;
};

function memory(): Memory {
  if (typeof window === "undefined") {
    const g = globalThis as typeof globalThis & { [MEMORY_KEY]?: Memory };
    if (!g[MEMORY_KEY]) {
      g[MEMORY_KEY] = {
        status: "checking",
        hostLabel: "",
        timer: null,
        inFlight: false,
        onUpdate: null,
      };
    }
    return g[MEMORY_KEY]!;
  }
  const w = window as Window & { [MEMORY_KEY]?: Memory };
  if (!w[MEMORY_KEY]) {
    w[MEMORY_KEY] = {
      status: "checking",
      hostLabel: "",
      timer: null,
      inFlight: false,
      onUpdate: null,
    };
  }
  return w[MEMORY_KEY]!;
}

/** `Localhost:5173` from page origin (real host:port). */
export function formatOriginHostLabel(
  loc: Pick<Location, "hostname" | "port" | "protocol"> | null | undefined = typeof window !==
  "undefined"
    ? window.location
    : null
): string {
  if (!loc) return "Unknown:0";
  const rawHost = (loc.hostname || "").trim() || "unknown";
  const host =
    rawHost === "127.0.0.1" || rawHost.toLowerCase() === "localhost"
      ? "Localhost"
      : rawHost;
  const port =
    loc.port?.trim() ||
    (loc.protocol === "https:" ? "443" : loc.protocol === "http:" ? "80" : "");
  return port ? `${host}:${port}` : host;
}

export function peekOriginLiveStatus(): StudioOriginLiveStatus {
  return memory().status;
}

export function formatOriginSessionLine(
  status: StudioOriginLiveStatus = memory().status,
  hostLabel = memory().hostLabel || formatOriginHostLabel()
): string {
  const state =
    status === "active"
      ? "Active"
      : status === "offline"
        ? "Offline"
        : "Checking…";
  return `Session: ${hostLabel} - ${state}`;
}

/** Probe page origin — HEAD then GET fallback. */
export async function probeStudioOrigin(): Promise<"active" | "offline"> {
  const m = memory();
  m.hostLabel = formatOriginHostLabel();
  if (typeof window === "undefined" || typeof fetch !== "function") {
    m.status = "offline";
    return "offline";
  }
  if (m.inFlight) return m.status === "active" ? "active" : "offline";
  m.inFlight = true;
  let origin = "";
  try {
    origin = String(window.location?.origin || "").replace(/\/$/, "");
  } catch {
    origin = "";
  }
  if (!origin || origin === "null") {
    m.status = "offline";
    m.inFlight = false;
    try {
      m.onUpdate?.();
    } catch {
      /* hang-safe */
    }
    return "offline";
  }
  const url = `${origin}/?_qa_origin_probe=${Date.now()}`;
  try {
    const ctrl =
      typeof AbortController !== "undefined" ? new AbortController() : null;
    const t =
      ctrl && typeof setTimeout === "function"
        ? setTimeout(() => ctrl.abort(), PROBE_TIMEOUT_MS)
        : null;
    let ok = false;
    try {
      const head = await fetch(url, {
        method: "HEAD",
        cache: "no-store",
        signal: ctrl?.signal,
      });
      ok = head.ok || head.status === 405 || head.status === 501;
    } catch {
      ok = false;
    }
    if (!ok) {
      try {
        const get = await fetch(url, {
          method: "GET",
          cache: "no-store",
          signal: ctrl?.signal,
        });
        ok = get.ok;
      } catch {
        ok = false;
      }
    }
    if (t != null) clearTimeout(t);
    m.status = ok ? "active" : "offline";
  } catch {
    m.status = "offline";
  } finally {
    m.inFlight = false;
  }
  try {
    m.onUpdate?.();
  } catch {
    /* hang-safe */
  }
  return m.status === "active" ? "active" : "offline";
}

/** Start periodic probe while QA overlay is open. */
export function armOriginProbe(onUpdate?: () => void): void {
  const m = memory();
  m.hostLabel = formatOriginHostLabel();
  if (onUpdate) m.onUpdate = onUpdate;
  if (m.status === "checking") {
    void probeStudioOrigin();
  }
  if (m.timer != null) return;
  m.timer = setInterval(() => {
    void probeStudioOrigin();
  }, PROBE_MS);
}

export function disarmOriginProbe(): void {
  const m = memory();
  if (m.timer != null) {
    clearInterval(m.timer);
    m.timer = null;
  }
  m.onUpdate = null;
}

export function resetOriginProbeForTests(): void {
  disarmOriginProbe();
  const m = memory();
  m.status = "checking";
  m.hostLabel = "";
  m.inFlight = false;
}
