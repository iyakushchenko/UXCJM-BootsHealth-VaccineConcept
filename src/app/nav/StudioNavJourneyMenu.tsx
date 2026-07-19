import type { OrchestraModeOption, OrchestraModeId } from "@/app/orchestra/types";
import { StudioNavStudioSelect } from "@/app/nav/StudioNavStudioSelect";

type Props = {
  modes: OrchestraModeOption[];
  value: OrchestraModeId;
  onChange: (modeId: OrchestraModeId) => void;
  isPlaying?: boolean;
  /** Locks mode switch during cursor / type-in animations. */
  controlsLocked?: boolean;
};

export function StudioNavJourneyMenu({
  modes,
  value,
  onChange,
  isPlaying,
  controlsLocked = false,
}: Props) {
  return (
    <StudioNavStudioSelect
      options={modes}
      value={value}
      onChange={onChange}
      ariaLabel="Orchestra mode"
      logAction="studio:orchestra-mode"
      isPlaying={isPlaying}
      controlsLocked={controlsLocked}
    />
  );
}
