/**
 * Session/Touchpoints sitrep — mid-flight brain without console.
 * Beat counter = selected journey beats (rec-* honesty), never STEPS frames as "Beat".
 */

import type { AgentTestingSitrep } from "@/app/shell/agent-testing/agentTestingTypes";
import {
  getControlPanelSnapshot,
  type ControlPanelSnapshot,
} from "@/app/shell/controlPanelLog";
import { parseStudioUrl } from "@/app/shell/studioUrl";

function pickString(
  snap: ControlPanelSnapshot | null | undefined,
  keys: string[]
): string | undefined {
  if (!snap) return undefined;
  for (const key of keys) {
    const v = snap[key];
    if (typeof v === "string" && v.trim()) return v.trim();
    if (typeof v === "number" && Number.isFinite(v)) return String(v);
  }
  return undefined;
}

function shortId(raw: string, max = 28): string {
  return raw.length > max ? `${raw.slice(0, max - 1)}…` : raw;
}

function isBuiltInCjmId(id: string | undefined): boolean {
  return id === "traditional-cjm" || id === "agentic-cjm";
}

/** Catalog beatCount for imported rec-* when snap is missing/zero. */
function catalogBeatCount(journeyId: string | undefined): number | undefined {
  if (!journeyId || typeof window === "undefined") return undefined;
  try {
    const w = window as Window & {
      __studioListJourneys?: () => Array<{ id: string; beatCount?: number }>;
    };
    const hit = w.__studioListJourneys?.()?.find((j) => j.id === journeyId);
    if (hit && typeof hit.beatCount === "number" && hit.beatCount > 0) {
      return hit.beatCount;
    }
  } catch {
    /* ignore */
  }
  return undefined;
}

/** Pull useful control-panel / playback snapshot into sitrep + session bars. */
export function readAgentTestingSitrep(): AgentTestingSitrep {
  let snap: ControlPanelSnapshot | null = null;
  try {
    snap = getControlPanelSnapshot();
  } catch {
    snap = null;
  }

  const orchestraMode =
    pickString(snap, ["orchestraModeId", "mode", "playbackMode"]) ?? undefined;
  const urlExperience =
    typeof window !== "undefined" && window.location?.search
      ? parseStudioUrl(window.location.search).experienceId ?? undefined
      : undefined;
  const experience =
    pickString(snap, ["experience"]) ??
    urlExperience ??
    (orchestraMode?.endsWith("-cjm") && !orchestraMode.startsWith("rec-")
      ? orchestraMode.slice(0, -4)
      : undefined) ??
    undefined;
  /** Experience path for Session bar (agentic | traditional) — not the CJM id. */
  const mode = experience;
  const projectId = pickString(snap, ["projectId", "project"]) ?? undefined;
  const personaId = pickString(snap, ["personaId", "persona"]) ?? undefined;
  const journeyId = pickString(snap, ["journeyId", "cjm"]) ?? undefined;
  /** CJM on/off or free journey name — do not duplicate Mode. */
  let cjm: string | undefined;
  if (snap?.journeyMode === true) {
    cjm =
      journeyId && !isBuiltInCjmId(journeyId) ? journeyId : "on";
  } else if (snap?.journeyMode === false) {
    cjm = "off";
  } else if (snap?.hubOpen === true) {
    cjm = "hub";
  } else if (journeyId) {
    cjm = journeyId;
  }
  const screenId =
    pickString(snap, ["screenId", "screen"]) ??
    (typeof window !== "undefined" && window.location?.search
      ? parseStudioUrl(window.location.search).screenId ?? undefined
      : undefined);
  const beatId = pickString(snap, ["beatId", "beatLabel"]) ?? undefined;
  const touchpointKey =
    pickString(snap, ["touchpointKey", "touchpointLabel"]) ?? undefined;

  /** Journey beat counter only — never STEPS frame progress as "Beat". */
  let counter: string | undefined;
  const beatIndex = snap?.beatIndex;
  let beatCount =
    typeof snap?.beatCount === "number" && snap.beatCount > 0
      ? snap.beatCount
      : undefined;
  const catalog = catalogBeatCount(journeyId);
  // rec-* / imported: catalog beatCount is SSoT (avoid traditional STEPS bleed as Beat n/11)
  if (journeyId && !isBuiltInCjmId(journeyId) && catalog != null) {
    beatCount = catalog;
  }
  if (
    typeof beatIndex === "number" &&
    typeof beatCount === "number" &&
    Number.isFinite(beatIndex) &&
    Number.isFinite(beatCount) &&
    beatCount > 0
  ) {
    const idx = Math.min(Math.max(0, beatIndex), beatCount - 1);
    counter = `${idx + 1}/${beatCount}`;
  }

  const stepsProgress = pickString(snap, ["scenarioProgress"]);
  const stepsCounter =
    stepsProgress && stepsProgress !== counter ? stepsProgress : undefined;

  /** Session bar = mid-flight brain (no console). Include screen always; beat when CJM. */
  const sessionParts = [
    mode ? `Mode ${shortId(mode, 20)}` : null,
    projectId ? `Project ${shortId(projectId, 22)}` : null,
    personaId ? `Persona ${shortId(personaId, 22)}` : null,
    cjm ? `CJM ${shortId(cjm, 24)}` : null,
    screenId ? `Screen ${shortId(screenId, 22)}` : null,
    snap?.journeyMode === true && counter ? `Beat ${counter}` : null,
    snap?.journeyMode === true && stepsCounter && stepsCounter !== counter
      ? `Steps ${stepsCounter}`
      : null,
  ].filter(Boolean);

  const sessionLine =
    sessionParts.length > 0
      ? sessionParts.join(" · ")
      : "Session — waiting for studio state";

  const dumpParts = [
    ...sessionParts,
    snap?.journeyMode !== true && counter ? `beat ${counter}` : null,
    beatId ? beatId : null,
    touchpointKey ? `tp ${touchpointKey}` : null,
    experience && experience !== mode ? `exp ${experience}` : null,
  ].filter(Boolean);

  return {
    mode,
    cjm,
    experience,
    projectId,
    personaId,
    screenId,
    beat: beatId,
    counter,
    touchpointKey,
    sessionLine,
    line:
      dumpParts.length > 0
        ? dumpParts.join(" · ")
        : "sitrep — waiting for control panel",
  };
}
