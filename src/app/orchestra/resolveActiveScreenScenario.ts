import {
  getProtoScenarioById,
  type ProtoScenarioScreenConfig,
} from "@/app/proto/protoScenarioEngine";
import { protoTabToIndex } from "@/app/proto/protoScreens";
import { getJourneyForMode } from "@/app/orchestra/brands/bootsSarahJourney";
import type { ProtoBrandPack, ProtoOrchestraModeId } from "@/app/orchestra/types";

export function resolveActiveScreenScenario(options: {
  hubOpen: boolean;
  modeId: ProtoOrchestraModeId;
  beatIndex: number;
  currentTabIndex: number;
  brandPack: ProtoBrandPack;
}): ProtoScenarioScreenConfig | undefined {
  const { hubOpen, modeId, beatIndex, currentTabIndex, brandPack } = options;

  if (hubOpen) return undefined;

  const journey = getJourneyForMode(brandPack, modeId);
  const beat = journey?.beats[beatIndex];
  if (beat?.kind !== "screen-frames" || !beat.scenarioId) return undefined;

  if (beat.protoTab != null && currentTabIndex !== protoTabToIndex(beat.protoTab)) {
    return undefined;
  }

  return getProtoScenarioById(beat.scenarioId);
}

export function orchestraShowControls(options: {
  hubOpen: boolean;
  modeId: ProtoOrchestraModeId;
  brandPack: ProtoBrandPack;
}): boolean {
  const { hubOpen, modeId, brandPack } = options;

  if (hubOpen) return false;

  return (getJourneyForMode(brandPack, modeId)?.beats.length ?? 0) > 0;
}
