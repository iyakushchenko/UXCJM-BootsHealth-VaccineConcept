import { useSyncExternalStore } from "react";
import type { OrchestraModeOption, OrchestraModeId } from "@/app/orchestra/types";
import { StudioNavStudioSelect } from "@/app/nav/StudioNavStudioSelect";
import {
  getActiveRecordingSession,
  subscribeRecordingSession,
} from "@/app/recording/recordingSession";

type Props = {
  modes: OrchestraModeOption[];
  value: OrchestraModeId;
  onChange: (modeId: OrchestraModeId) => void;
  isPlaying?: boolean;
  /** Locks mode switch during cursor / type-in animations. */
  controlsLocked?: boolean;
};

function useRecordingSessionLive(): boolean {
  return useSyncExternalStore(
    subscribeRecordingSession,
    () => getActiveRecordingSession() != null,
    () => false
  );
}

export function StudioNavJourneyMenu({
  modes,
  value,
  onChange,
  isPlaying,
  controlsLocked = false,
}: Props) {
  /** REC ● start → live/paused session: show NEW CJM (not overwrite selected). */
  const recordingNewCjm = useRecordingSessionLive();

  return (
    <StudioNavStudioSelect
      options={modes}
      value={value}
      onChange={onChange}
      ariaLabel="Orchestra mode"
      logAction="studio:orchestra-mode"
      isPlaying={isPlaying}
      controlsLocked={controlsLocked}
      displayLabelOverride={recordingNewCjm ? "NEW CJM" : null}
      highlightGold={recordingNewCjm}
    />
  );
}
