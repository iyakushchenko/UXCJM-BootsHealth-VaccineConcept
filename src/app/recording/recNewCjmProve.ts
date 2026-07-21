/**
 * REC robustness prove — ALWAYS create a NEW random CJM, then Play that one.
 *
 * FORBIDDEN as prove: only playing built-in agentic-cjm / traditional-cjm
 * or replaying an old rec-* and calling REC robustness done.
 *
 * Window: `__studioRunRecNewCjmProve` / `__protoRunRecNewCjmProve`
 */

import { armRecCapture, assertRecLive, type RecArmCaptureHooks } from "@/app/recording/recArmCapture";
import {
  isRecordingActive,
  stopRecording,
  type StartRecordingOptions,
} from "@/app/recording/recordingSession";
import { resolveUsableDemoClickTarget } from "@/app/recording/recordingCapture";
import { describeRecordingClickTarget } from "@/app/recording/recordingCapture";
import {
  forceClearAgentTestingOverlay,
  logAgentTestingStep,
  startAgentTestingOverlay,
  touchAgentTestingOverlay,
} from "@/app/shell/agent-testing";
import { runFullPlayProve, type FullPlayProvePeak } from "@/app/shell/fullPlayProve";
import { simulateDemoPointerClick } from "@/app/scenario/demoCursor";

export type RecNewCjmProveOptions = {
  experience?: "agentic" | "traditional";
  label?: string;
  /** Max wait for Play prove of the new journey. */
  timeoutMs?: number;
  settleMs?: number;
};

export type RecNewCjmProveResult = {
  pass: boolean;
  journeyId: string | null;
  recLive: boolean;
  peak: FullPlayProvePeak | null;
  errors: string[];
};

export type RecNewCjmProveHooks = RecArmCaptureHooks & {
  setOrchestraMode?: (modeId: string) => void;
  getStartOptions?: () => StartRecordingOptions;
};

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

function mintProveLabel(experience: "agentic" | "traditional"): string {
  const stamp = Date.now().toString(36);
  const rand = Math.random().toString(36).slice(2, 6);
  return `REC prove ${experience} ${stamp}-${rand}`;
}

/** Honest click targets — never coarse shell / tiles container. */
const PROVE_CLICK_SELECTORS = [
  '[data-studio-action="plp-book-now"]',
  '[data-studio-action="plp-quick-view"]',
  'a[href*="pdp"]',
  'button[data-studio-action]',
  '[data-studio-action]',
] as const;

function pickHonestClickTarget(): HTMLElement | null {
  for (const sel of PROVE_CLICK_SELECTORS) {
    const nodes = document.querySelectorAll<HTMLElement>(sel);
    for (const node of nodes) {
      if (!node.isConnected) continue;
      const rect = node.getBoundingClientRect();
      if (rect.width < 4 || rect.height < 4) continue;
      const usable = resolveUsableDemoClickTarget(node);
      if (usable) return usable;
    }
  }
  return null;
}

function goPlpViaUrlOrTab(): void {
  // Prefer URL deep-link (same as PO / prove recipe) when not already on PLP.
  try {
    const url = new URL(window.location.href);
    if (url.searchParams.get("screen") !== "plp") {
      url.searchParams.set("project", url.searchParams.get("project") || "boots-pharmacy");
      url.searchParams.set("screen", "plp");
      url.searchParams.set("persona", url.searchParams.get("persona") || "sarah-jenkins");
      url.searchParams.set("cjm", "off");
      url.searchParams.set(
        "experience",
        url.searchParams.get("experience") || "traditional"
      );
      window.history.replaceState(window.history.state, "", `${url.pathname}${url.search}${url.hash}`);
      window.dispatchEvent(new PopStateEvent("popstate"));
    }
  } catch {
    /* hang-safe */
  }
  const tab =
    document.querySelector<HTMLElement>(
      '[data-studio-screen="plp"], button[aria-label*="Vaccination"], [data-screen-id="plp"]'
    ) ??
    Array.from(document.querySelectorAll<HTMLElement>("button, a")).find((el) =>
      /vaccination|plp/i.test(el.textContent ?? "")
    );
  tab?.click();
}

/**
 * ALWAYS CLEAR → arm REC (CREATE NEW) → short random path → Add as CJM →
 * Play THAT new journey. FAIL if rec never live or journeyId missing.
 */
export async function runRecNewCjmProve(
  hooks: RecNewCjmProveHooks,
  options?: RecNewCjmProveOptions
): Promise<RecNewCjmProveResult> {
  const experience = options?.experience ?? "traditional";
  const settle = options?.settleMs ?? 100;
  const errors: string[] = [];
  let journeyId: string | null = null;
  let recLive = false;
  let peak: FullPlayProvePeak | null = null;

  // 1) ALWAYS CLEAR prior QA.
  forceClearAgentTestingOverlay();
  startAgentTestingOverlay("AGENT TESTING — REC new CJM prove");
  touchAgentTestingOverlay("AGENT TESTING — REC new CJM prove");

  try {
    logAgentTestingStep({
      kind: "rec",
      action: "RunRecNewCjmProve",
      label: `REC robustness = NEW CJM only · ${experience}`,
      outcome: "ok",
    });
  } catch {
    /* hang-safe */
  }

  // Seed orchestra flavor so minted id is rec-trad-* / rec-agentic-*.
  const seedMode =
    experience === "traditional" ? "traditional-cjm" : "agentic-cjm";
  hooks.setOrchestraMode?.(seedMode);
  await delay(settle);

  // Land on PLP for a short traditional capture path.
  goPlpViaUrlOrTab();
  await delay(settle * 4);
  // Wait briefly for Book now / action targets to mount.
  for (let i = 0; i < 20 && !pickHonestClickTarget(); i++) {
    await delay(150);
  }

  // 2) Arm REC for real (CREATE NEW + Start).
  const armed = await armRecCapture(hooks);
  recLive = armed.ok;
  if (!armed.ok) {
    errors.push(armed.reason ?? "REC arm failed");
    return failResult(errors, journeyId, recLive, peak);
  }

  const assert1 = assertRecLive();
  if (!assert1.ok) {
    errors.push(assert1.reason ?? "assertRecLive failed after arm");
    return failResult(errors, journeyId, false, peak);
  }

  // 3) Short NEW random path — honest robo-cursor target.
  const target = pickHonestClickTarget();
  if (!target) {
    errors.push("no honest click target (data-studio-action) on page");
    if (isRecordingActive()) stopRecording();
    return failResult(errors, journeyId, recLive, peak);
  }

  try {
    logAgentTestingStep({
      kind: "rec",
      action: "RecNewCjmCaptureClick",
      label: `robo-cursor · ${describeRecordingClickTarget(target)}`,
      outcome: "ok",
    });
  } catch {
    /* hang-safe */
  }

  const clickOk = await simulateDemoPointerClick(target, { scroll: true });
  if (!clickOk) {
    errors.push("robo-cursor click failed / degraded target");
    if (isRecordingActive()) stopRecording();
    return failResult(errors, journeyId, recLive, peak);
  }
  await delay(settle * 3);

  // 4) Stop + Add as CJM with unique random title.
  if (!isRecordingActive()) {
    errors.push("REC died before Stop");
    return failResult(errors, journeyId, false, peak);
  }
  stopRecording();
  await delay(settle);

  const label = options?.label?.trim() || mintProveLabel(experience);
  const saveFn =
    (
      window as Window & {
        __studioSaveRecordingAsJourney?: (opts?: {
          label?: string;
          addAsNew?: boolean;
        }) => { journey: { id: string } };
        __protoSaveRecordingAsJourney?: (opts?: {
          label?: string;
          addAsNew?: boolean;
        }) => { journey: { id: string } };
      }
    ).__studioSaveRecordingAsJourney ??
    (
      window as Window & {
        __protoSaveRecordingAsJourney?: (opts?: {
          label?: string;
          addAsNew?: boolean;
        }) => { journey: { id: string } };
      }
    ).__protoSaveRecordingAsJourney;

  if (!saveFn) {
    errors.push("SaveRecordingAsJourney helper missing");
    return failResult(errors, journeyId, recLive, peak);
  }

  let saved: { journey: { id: string } };
  try {
    saved = saveFn({ label, addAsNew: true });
  } catch (err) {
    errors.push(
      `Add as CJM failed: ${err instanceof Error ? err.message : String(err)}`
    );
    return failResult(errors, journeyId, recLive, peak);
  }

  journeyId = saved.journey?.id ?? null;
  if (!journeyId || journeyId === "agentic-cjm" || journeyId === "traditional-cjm") {
    errors.push(`journeyId missing or built-in: ${journeyId ?? "null"}`);
    return failResult(errors, null, recLive, peak);
  }
  if (!/^rec-/i.test(journeyId)) {
    errors.push(`journeyId not a new rec-* id: ${journeyId}`);
    return failResult(errors, journeyId, recLive, peak);
  }

  // 5) Play THAT new journey continuously (not built-in).
  const play = await runFullPlayProve({
    journeyId,
    experience,
    timeoutMs: options?.timeoutMs ?? 120_000,
  });
  peak = play.peak;
  if (!play.pass) {
    errors.push(...(play.errors.length ? play.errors : ["Play prove failed"]));
  }

  const pass = errors.length === 0 && Boolean(journeyId) && recLive && play.pass;
  try {
    logAgentTestingStep({
      kind: "rec",
      action: "RunRecNewCjmProve",
      label: pass
        ? `REC new CJM PASS · ${journeyId}`
        : `REC new CJM FAIL · ${errors.join("; ")}`,
      outcome: pass ? "ok" : "fail",
    });
  } catch {
    /* hang-safe */
  }

  return { pass, journeyId, recLive, peak, errors };
}

function failResult(
  errors: string[],
  journeyId: string | null,
  recLive: boolean,
  peak: FullPlayProvePeak | null
): RecNewCjmProveResult {
  try {
    logAgentTestingStep({
      kind: "rec",
      action: "RunRecNewCjmProve",
      label: `REC new CJM FAIL · ${errors.join("; ")}`,
      outcome: "fail",
    });
  } catch {
    /* hang-safe */
  }
  return { pass: false, journeyId, recLive, peak, errors };
}
