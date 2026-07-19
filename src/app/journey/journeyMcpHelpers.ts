import type { JourneyDefinition } from "@/app/orchestra/types";
import {
  deserializeJourneyBundleFile,
  deserializeJourneyFile,
  serializeJourneyBundleFile,
  serializeJourneyFile,
  summarizeJourney,
  type JourneyBundleFile,
  type JourneyFile,
} from "@/app/journey/journeyFile";
import {
  applyImportedJourneyBundle,
  applyImportedJourneyFile,
  clearImportedJourneys,
  getImportedJourneys,
} from "@/app/journey/journeyRuntimeStore";
import type { PersonaId, ProjectId } from "@/projects/types";
import { armOverlayOnStudioHelpers } from "@/app/shell/helperOverlayArm";

declare global {
  interface Window {
    __protoListJourneys?: () => ReturnType<typeof summarizeJourney>[];
    __protoExportJourney?: (journeyId?: string) => string | null;
    __protoExportJourneyBundle?: () => string;
    __protoImportJourney?: (json: string) => JourneyFile;
    __protoImportJourneyBundle?: (json: string) => JourneyBundleFile;
    __protoApplyJourney?: (json: string) => ReturnType<typeof summarizeJourney>;
    __protoApplyJourneyBundle?: (
      json: string
    ) => ReturnType<typeof summarizeJourney>[];
    __protoClearImportedJourneys?: () => void;
    __protoHasImportedJourneys?: () => boolean;
  }
}

export function registerJourneyMcpHelpers(options: {
  projectId: ProjectId;
  personaId: PersonaId;
  getJourneys: () => JourneyDefinition[];
  getActiveJourneyId?: () => string | undefined;
  onJourneysApplied?: () => void;
}): () => void {
  if (typeof window === "undefined") return () => {};

  const resolveJourney = (journeyId?: string): JourneyDefinition | null => {
    const journeys = options.getJourneys();
    const id = journeyId ?? options.getActiveJourneyId?.();
    if (!id) return journeys[0] ?? null;
    return journeys.find((journey) => journey.id === id) ?? null;
  };

  window.__protoListJourneys = () =>
    options.getJourneys().map((journey) => summarizeJourney(journey));

  window.__protoExportJourney = (journeyId) => {
    const journey = resolveJourney(journeyId);
    if (!journey) return null;
    return serializeJourneyFile({
      journey,
      projectId: options.projectId,
      personaId: options.personaId,
    });
  };

  window.__protoExportJourneyBundle = () =>
    serializeJourneyBundleFile({
      journeys: options.getJourneys(),
      projectId: options.projectId,
      personaId: options.personaId,
    });

  window.__protoImportJourney = (json) => deserializeJourneyFile(json);

  window.__protoImportJourneyBundle = (json) =>
    deserializeJourneyBundleFile(json);

  window.__protoApplyJourney = (json) => {
    const file = deserializeJourneyFile(json);
    applyImportedJourneyFile(file);
    options.onJourneysApplied?.();
    return summarizeJourney(file.journey);
  };

  window.__protoApplyJourneyBundle = (json) => {
    const bundle = deserializeJourneyBundleFile(json);
    applyImportedJourneyBundle(bundle);
    options.onJourneysApplied?.();
    return bundle.journeys.map((journey) => summarizeJourney(journey));
  };

  window.__protoClearImportedJourneys = () => {
    clearImportedJourneys();
    options.onJourneysApplied?.();
  };

  window.__protoHasImportedJourneys = () => getImportedJourneys().length > 0;

  armOverlayOnStudioHelpers();

  return () => {
    delete window.__protoListJourneys;
    delete window.__protoExportJourney;
    delete window.__protoExportJourneyBundle;
    delete window.__protoImportJourney;
    delete window.__protoImportJourneyBundle;
    delete window.__protoApplyJourney;
    delete window.__protoApplyJourneyBundle;
    delete window.__protoClearImportedJourneys;
    delete window.__protoHasImportedJourneys;
  };
}
