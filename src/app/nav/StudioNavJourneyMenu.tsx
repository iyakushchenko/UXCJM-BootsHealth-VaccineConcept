import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import type { OrchestraModeOption, OrchestraModeId } from "@/app/orchestra/types";
import {
  CREATE_NEW_CJM_MODE_ID,
  CREATE_NEW_CJM_OPTION,
} from "@/app/orchestra/orchestraModes";
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
  /**
   * Idle CREATE NEW CJM selection (Import path). Live REC also reports true.
   * Parent uses this for Import visibility — not a playable orchestra mode.
   */
  onCreateNewSelectedChange?: (selected: boolean) => void;
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
  onCreateNewSelectedChange,
}: Props) {
  /** REC ● start → live/paused session: CREATE NEW CJM selected (gold). */
  const recordingLive = useRecordingSessionLive();
  const [idleCreateNew, setIdleCreateNew] = useState(false);
  const priorPickerRef = useRef<{ createNew: boolean } | null>(null);
  const wasLiveRef = useRef(false);
  const idleCreateNewRef = useRef(idleCreateNew);
  idleCreateNewRef.current = idleCreateNew;
  const onCreateNewSelectedChangeRef = useRef(onCreateNewSelectedChange);
  onCreateNewSelectedChangeRef.current = onCreateNewSelectedChange;

  const createNewSelected = recordingLive || idleCreateNew;

  useEffect(() => {
    onCreateNewSelectedChangeRef.current?.(createNewSelected);
  }, [createNewSelected]);

  useEffect(() => {
    if (recordingLive && !wasLiveRef.current) {
      priorPickerRef.current = { createNew: idleCreateNewRef.current };
      setIdleCreateNew(true);
    } else if (!recordingLive && wasLiveRef.current) {
      const prior = priorPickerRef.current;
      priorPickerRef.current = null;
      setIdleCreateNew(prior?.createNew ?? false);
    }
    wasLiveRef.current = recordingLive;
  }, [recordingLive]);

  const options = useMemo(
    () => [CREATE_NEW_CJM_OPTION, ...modes],
    [modes]
  );

  const menuValue = createNewSelected
    ? CREATE_NEW_CJM_MODE_ID
    : value;

  const handleChange = (id: OrchestraModeId) => {
    if (id === CREATE_NEW_CJM_MODE_ID) {
      setIdleCreateNew(true);
      return;
    }
    setIdleCreateNew(false);
    onChange(id);
  };

  return (
    <StudioNavStudioSelect
      options={options}
      value={menuValue}
      onChange={handleChange}
      ariaLabel="Orchestra mode"
      logAction="studio:orchestra-mode"
      isPlaying={isPlaying}
      controlsLocked={controlsLocked || recordingLive}
      highlightGold={recordingLive}
      separatorAfterId={CREATE_NEW_CJM_MODE_ID}
      disabledTitle={
        recordingLive ? "CJM picker locked while recording" : undefined
      }
    />
  );
}
