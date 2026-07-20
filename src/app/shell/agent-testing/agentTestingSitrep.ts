import type { AgentTestingSitrep } from "@/app/shell/agent-testing/agentTestingTypes";
import {
  getControlPanelSnapshot,
  type ControlPanelSnapshot,
} from "@/app/shell/controlPanelLog";

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
  const experience =
    pickString(snap, ["experience"]) ??
    (orchestraMode?.endsWith("-cjm")
      ? orchestraMode.slice(0, -4)
      : orchestraMode) ??
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
      journeyId &&
      journeyId !== "traditional-cjm" &&
      journeyId !== "agentic-cjm"
        ? journeyId
        : "on";
  } else if (snap?.journeyMode === false) {
    cjm = "off";
  } else if (snap?.hubOpen === true) {
    cjm = "hub";
  } else if (journeyId) {
    cjm = journeyId;
  }
  const screenId = pickString(snap, ["screenId", "screen"]) ?? undefined;
  const beatId = pickString(snap, ["beatId", "beatLabel"]) ?? undefined;
  const touchpointKey =
    pickString(snap, ["touchpointKey", "touchpointLabel"]) ?? undefined;

  let counter: string | undefined;
  const beatIndex = snap?.beatIndex;
  const beatCount = snap?.beatCount;
  if (
    typeof beatIndex === "number" &&
    typeof beatCount === "number" &&
    Number.isFinite(beatIndex) &&
    Number.isFinite(beatCount)
  ) {
    counter = `${beatIndex + 1}/${beatCount}`;
  } else {
    counter = pickString(snap, ["scenarioProgress", "counter"]);
  }

  const sessionParts = [
    mode ? `Mode ${shortId(mode, 20)}` : null,
    projectId ? `Project ${shortId(projectId, 22)}` : null,
    personaId ? `Persona ${shortId(personaId, 22)}` : null,
    cjm ? `CJM ${shortId(cjm, 24)}` : null,
  ].filter(Boolean);

  const sessionLine =
    sessionParts.length > 0
      ? sessionParts.join(" · ")
      : "Session — waiting for studio state";

  const dumpParts = [
    ...sessionParts,
    screenId ? `screen ${screenId}` : null,
    counter ? `beat ${counter}` : null,
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
