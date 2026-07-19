import type { ProtoJourneyDefinition } from "@/app/orchestra/types";
import type { ProtoPersonaId, ProtoProjectId } from "@/projects/types";

export const JOURNEY_FILE_VERSION = 1 as const;

export type ProtoJourneyFile = {
  version: typeof JOURNEY_FILE_VERSION;
  exportedAt: string;
  projectId?: ProtoProjectId;
  personaId?: ProtoPersonaId;
  journey: ProtoJourneyDefinition;
};

export type ProtoJourneyBundleFile = {
  version: typeof JOURNEY_FILE_VERSION;
  exportedAt: string;
  projectId?: ProtoProjectId;
  personaId?: ProtoPersonaId;
  journeys: ProtoJourneyDefinition[];
};

const BEAT_KINDS = new Set(["screen-frames", "tab-landing", "overlay"]);

function assertJourneyDefinition(journey: unknown): ProtoJourneyDefinition {
  if (!journey || typeof journey !== "object") {
    throw new Error("Invalid journey payload");
  }
  const record = journey as ProtoJourneyDefinition;
  if (!record.id || typeof record.id !== "string") {
    throw new Error("Journey id is required");
  }
  if (!record.label || typeof record.label !== "string") {
    throw new Error("Journey label is required");
  }
  if (!Array.isArray(record.beats)) {
    throw new Error("Journey beats must be an array");
  }
  for (const beat of record.beats) {
    if (!beat?.id || !beat?.label || !BEAT_KINDS.has(beat.kind)) {
      throw new Error(`Invalid beat in journey ${record.id}`);
    }
  }
  return record;
}

export function serializeJourneyFile(options: {
  journey: ProtoJourneyDefinition;
  projectId?: ProtoProjectId;
  personaId?: ProtoPersonaId;
}): string {
  const payload: ProtoJourneyFile = {
    version: JOURNEY_FILE_VERSION,
    exportedAt: new Date().toISOString(),
    projectId: options.projectId,
    personaId: options.personaId,
    journey: options.journey,
  };
  return JSON.stringify(payload, null, 2);
}

export function serializeJourneyBundleFile(options: {
  journeys: ProtoJourneyDefinition[];
  projectId?: ProtoProjectId;
  personaId?: ProtoPersonaId;
}): string {
  const payload: ProtoJourneyBundleFile = {
    version: JOURNEY_FILE_VERSION,
    exportedAt: new Date().toISOString(),
    projectId: options.projectId,
    personaId: options.personaId,
    journeys: options.journeys,
  };
  return JSON.stringify(payload, null, 2);
}

export function deserializeJourneyFile(raw: string): ProtoJourneyFile {
  const parsed = JSON.parse(raw) as ProtoJourneyFile;
  if (parsed.version !== JOURNEY_FILE_VERSION) {
    throw new Error(`Unsupported journey file version: ${parsed.version}`);
  }
  return {
    ...parsed,
    journey: assertJourneyDefinition(parsed.journey),
  };
}

export function deserializeJourneyBundleFile(raw: string): ProtoJourneyBundleFile {
  const parsed = JSON.parse(raw) as ProtoJourneyBundleFile;
  if (parsed.version !== JOURNEY_FILE_VERSION) {
    throw new Error(`Unsupported journey file version: ${parsed.version}`);
  }
  if (!Array.isArray(parsed.journeys)) {
    throw new Error("Journey bundle must include journeys array");
  }
  return {
    ...parsed,
    journeys: parsed.journeys.map((journey) => assertJourneyDefinition(journey)),
  };
}

export function summarizeJourney(journey: ProtoJourneyDefinition): {
  id: string;
  label: string;
  beatCount: number;
  beatIds: string[];
} {
  return {
    id: journey.id,
    label: journey.label,
    beatCount: journey.beats.length,
    beatIds: journey.beats.map((beat) => beat.id),
  };
}
