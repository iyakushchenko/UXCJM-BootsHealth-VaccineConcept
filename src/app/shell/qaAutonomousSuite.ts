export type QaSuiteTestId =
  | "mcp-sanity"
  | "mcp-page-probe"
  | "play-current-cjm"
  | "play-all-cjms"
  | "map-current-interactions"
  | "map-all-interactions"
  | "qa-self-test"
  | "control-room-traditional"
  | "play-agentic"
  | "play-traditional"
  | "rec-traditional"
  | "token-lean-matrix";

export type QaSuiteTest = { id: QaSuiteTestId; options?: Record<string, unknown> };
export const QA_SUITE_COLLECTION: ReadonlyArray<{
  id: string;
  label: string;
  description: string;
  tests: readonly QaSuiteTest[];
}> = [
  { id: "tool-health", label: "QA tool health", description: "Non-destructive live logger and runner sanity", tests: [{ id: "mcp-sanity" }] },
  { id: "current-page", label: "Test current page", description: "Run the current project's registered page contract", tests: [{ id: "mcp-page-probe" }] },
  { id: "current-interactions", label: "Map current page interactions", description: "Inventory and grade every visible interactive candidate without activating it", tests: [{ id: "map-current-interactions" }] },
  { id: "all-interactions", label: "Map all project interactions", description: "Inventory Hub and every registered project page into one machine-readable report", tests: [{ id: "map-all-interactions" }] },
  { id: "current-cjm", label: "Test current CJM", description: "Continuously play and prove the currently selected CJM", tests: [{ id: "play-current-cjm" }] },
  { id: "all-cjms", label: "Test all CJMs", description: "Enumerate and continuously prove every CJM in the current project", tests: [{ id: "play-all-cjms" }] },
  { id: "project-core", label: "Current project core", description: "QA health, current page contract, interaction map, and every project CJM", tests: [{ id: "mcp-sanity" }, { id: "mcp-page-probe" }, { id: "map-all-interactions" }, { id: "play-all-cjms" }] },
];

export function getQaSuiteDefinition(id: string) {
  return QA_SUITE_COLLECTION.find((suite) => suite.id === id);
}
export type QaSuiteStatus = {
  suiteId: string;
  phase: "idle" | "running" | "paused-failure" | "passed" | "cancelled";
  index: number;
  total: number;
  current: QaSuiteTestId | null;
  completed: Array<{ id: QaSuiteTestId; pass: boolean }>;
  failure: { id: QaSuiteTestId; message: string; result?: unknown } | null;
};

const STORAGE_KEY = "studioAutonomousQaSuiteV1";
let activeTests: QaSuiteTest[] = [];
let status: QaSuiteStatus = emptyStatus();
let runToken = 0;

function emptyStatus(): QaSuiteStatus {
  return { suiteId: "", phase: "idle", index: 0, total: 0, current: null, completed: [], failure: null };
}

function persist(): void {
  try { sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ status, tests: activeTests })); } catch { /* storage optional */ }
}

function publish(): void {
  persist();
  window.dispatchEvent(new CustomEvent("studio:qa-suite-status", { detail: status }));
}

export function getAutonomousQaSuiteStatus(): QaSuiteStatus {
  return structuredClone(status);
}

export function startAutonomousQaSuite(
  tests: Array<QaSuiteTestId | QaSuiteTest>,
  options?: { suiteId?: string },
) {
  if (status.phase === "running") return { accepted: false, status };
  if (!Array.isArray(tests) || tests.length < 1 || tests.length > 100) {
    throw new Error("QA suite requires 1–100 tests");
  }
  activeTests = tests.map((test) => typeof test === "string" ? { id: test } : test);
  status = {
    suiteId: options?.suiteId?.trim() || `qa-${Date.now().toString(36)}`,
    phase: "running",
    index: 0,
    total: activeTests.length,
    current: null,
    completed: [],
    failure: null,
  };
  const token = ++runToken;
  publish();
  void runRemaining(token);
  return { accepted: true, status };
}

export function startQaSuiteById(id: string) {
  const suite = getQaSuiteDefinition(id);
  if (!suite) throw new Error(`Unknown QA suite: ${id}`);
  return startAutonomousQaSuite([...suite.tests], { suiteId: suite.id });
}

function passOf(result: unknown): boolean {
  if (result === true) return true;
  if (!result || typeof result !== "object") return false;
  const value = result as { pass?: unknown; ok?: unknown };
  return value.pass === true || value.ok === true;
}

type JourneySummary = { id: string; label: string; beatCount: number; beatIds: string[] };

function activeJourneyId(): string | null {
  const state = (window as Window & { __protoStudioState?: () => { orchestraMode?: string } }).__protoStudioState?.();
  return state?.orchestraMode?.trim() || null;
}

async function proveJourney(journeyId: string): Promise<unknown> {
  const runner = window.__studioRunFullPlayProve;
  if (!runner) return { pass: false, journeyId, failureStep: "runner-unavailable" };
  const timeoutMs = 90_000;
  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<unknown>((resolve) => {
    timeoutId = setTimeout(() => {
      window.__protoPlaybackAbortAll?.();
      resolve({
        pass: false,
        journeyId,
        failureStep: "cjm-playback-timeout",
        message: `CJM playback exceeded ${timeoutMs / 1000}s`,
      });
    }, timeoutMs);
  });
  try {
    return await Promise.race([runner({ journeyId }), timeout]);
  } finally {
    if (timeoutId !== undefined) clearTimeout(timeoutId);
  }
}

async function proveAllJourneys(): Promise<{ pass: boolean; results: Array<{ journeyId: string; pass: boolean; result: unknown }> }> {
  const journeys = window.__protoListJourneys?.() ?? [];
  const results: Array<{ journeyId: string; pass: boolean; result: unknown }> = [];
  for (const journey of journeys) {
    const result = await proveJourney(journey.id);
    const pass = passOf(result);
    results.push({ journeyId: journey.id, pass, result });
    if (!pass) return { pass: false, results };
  }
  return { pass: journeys.length > 0, results };
}

async function runTest(test: QaSuiteTest): Promise<unknown> {
  switch (test.id) {
    case "mcp-sanity": return window.__studioRunMcpSanityCheck?.();
    case "mcp-page-probe": return window.__studioRunMcpPageProbe?.();
    case "play-current-cjm": {
      const journeyId = activeJourneyId();
      if (!journeyId) throw new Error("No active CJM is selected");
      return proveJourney(journeyId);
    }
    case "play-all-cjms": return proveAllJourneys();
    case "map-current-interactions": return window.__studioMapCurrentInteractions?.();
    case "map-all-interactions": return window.__studioMapAllInteractions?.();
    case "qa-self-test": return window.__studioRunQaSelfTestSmoke?.();
    case "control-room-traditional": return window.__protoRunTraditionalControlRoomRobotQa?.();
    case "play-agentic": return window.__studioRunFullPlayProve?.({ experience: "agentic" });
    case "play-traditional": return window.__studioRunFullPlayProve?.({ experience: "traditional" });
    case "rec-traditional": return window.__studioRunRecNewCjmProve?.({ experience: "traditional" });
    case "token-lean-matrix": return window.__studioRunTokenLeanRegressionMatrix?.(test.options);
  }
}

async function runRemaining(token: number): Promise<void> {
  while (token === runToken && status.index < activeTests.length) {
    const test = activeTests[status.index];
    status = { ...status, phase: "running", current: test.id, failure: null };
    window.__studioAgentTestingOverlay?.touch(`QA suite · ${status.index + 1}/${status.total} · ${test.id}`);
    publish();
    let result: unknown;
    try {
      result = await runTest(test);
      if (!passOf(result)) throw new Error("Test returned a non-passing result");
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      status = { ...status, phase: "paused-failure", current: test.id, failure: { id: test.id, message, result } };
      window.__studioAgentTestingOverlay?.logStep({ label: `Suite stopped · ${test.id} · ${message}`, outcome: "fail" });
      window.__studioAgentTestingOverlay?.ringAlarm(`QA suite ${status.suiteId} stopped at ${test.id}: ${message}`);
      window.__studioAgentTestingOverlay?.appendFinale("fail", `${test.id} · ${message}`);
      publish();
      return;
    }
    status.completed.push({ id: test.id, pass: true });
    status = { ...status, index: status.index + 1 };
    publish();
  }
  if (token !== runToken) return;
  status = { ...status, phase: "passed", current: null, failure: null };
  window.__studioAgentTestingOverlay?.appendFinale("pass", `${status.total}/${status.total} autonomous tests passed`);
  publish();
}

export function installAutonomousQaSuiteApi(): () => void {
  try {
    const saved = JSON.parse(sessionStorage.getItem(STORAGE_KEY) ?? "null") as { status?: QaSuiteStatus; tests?: QaSuiteTest[] } | null;
    if (saved?.status?.phase === "paused-failure" && Array.isArray(saved.tests)) {
      status = saved.status;
      activeTests = saved.tests;
    }
  } catch { /* corrupt state starts clean */ }

  window.__studioStartQaSuite = startAutonomousQaSuite;
  window.__studioRunQaSuiteById = startQaSuiteById;
  window.__studioRunGlobalCompatibilityTests = () => startQaSuiteById("all-cjms");
  window.__studioGetQaSuiteStatus = getAutonomousQaSuiteStatus;
  window.__studioProceedQaSuite = () => {
    if (status.phase !== "paused-failure") return { accepted: false, status };
    window.__studioAgentTestingOverlay?.ackDiagnostic();
    window.__studioAgentTestingOverlay?.consumePoSignal();
    const token = ++runToken;
    status = { ...status, phase: "running", failure: null };
    publish();
    void runRemaining(token);
    return { accepted: true, status };
  };
  window.__studioCancelQaSuite = () => {
    runToken += 1;
    window.__protoAbortAll?.();
    status = { ...status, phase: "cancelled", current: null };
    publish();
    return status;
  };
  // Studio helper registration follows orchestra-mode changes. The autonomous
  // runner must outlive that React effect churn or a suite would cancel itself
  // while switching between Agentic and Traditional tests.
  return () => {};
}

declare global {
  interface Window {
    __studioStartQaSuite?: (tests: Array<QaSuiteTestId | QaSuiteTest>, options?: { suiteId?: string }) => { accepted: boolean; status: QaSuiteStatus };
    __studioRunQaSuiteById?: typeof startQaSuiteById;
    __studioRunGlobalCompatibilityTests?: () => ReturnType<typeof startQaSuiteById>;
    __studioGetQaSuiteStatus?: () => QaSuiteStatus;
    __studioProceedQaSuite?: () => { accepted: boolean; status: QaSuiteStatus };
    __studioCancelQaSuite?: () => QaSuiteStatus;
    __studioRunMcpSanityCheck?: () => Promise<unknown>;
    __studioRunQaSelfTestSmoke?: () => Promise<unknown>;
    __studioRunFullPlayProve?: (options: { experience?: "agentic" | "traditional"; journeyId?: string }) => Promise<unknown>;
    __studioRunMcpPageProbe?: () => Promise<unknown>;
    __protoListJourneys?: () => JourneySummary[];
    __studioRunRecNewCjmProve?: (options: { experience: "traditional" }) => Promise<unknown>;
    __studioRunTokenLeanRegressionMatrix?: (options?: Record<string, unknown>) => Promise<unknown>;
    __protoAbortAll?: () => void;
  }
}
