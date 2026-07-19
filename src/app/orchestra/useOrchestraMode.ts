import { useCallback, useMemo, useState } from "react";
import { getJourneyForMode } from "@/app/orchestra/journeyUtils";
import {
  ORCHESTRA_MODE_OPTIONS,
  readStoredOrchestraMode,
  storeOrchestraMode,
} from "@/app/orchestra/orchestraModes";
import type { BrandPack, OrchestraModeId } from "@/app/orchestra/types";

/** @deprecated Prefer `useStudio` from `@/app/shell/useStudio`. */
export function useOrchestraMode(brandPack: BrandPack) {
  const [modeId, setModeIdState] = useState<OrchestraModeId>(readStoredOrchestraMode);
  const [beatIndex, setBeatIndex] = useState(0);

  const journey = useMemo(
    () => getJourneyForMode(brandPack.journeys, modeId),
    [brandPack, modeId]
  );

  const modeLabel =
    ORCHESTRA_MODE_OPTIONS.find((m) => m.id === modeId)?.label ?? "Agentic CJM";

  const setModeId = useCallback((next: OrchestraModeId) => {
    setModeIdState(next);
    storeOrchestraMode(next);
    setBeatIndex(0);
  }, []);

  const resetBeatIndex = useCallback(() => {
    setBeatIndex(0);
  }, []);

  return {
    modeId,
    setModeId,
    modeLabel,
    modes: ORCHESTRA_MODE_OPTIONS,
    journey,
    beatIndex,
    setBeatIndex,
    resetBeatIndex,
  };
}
