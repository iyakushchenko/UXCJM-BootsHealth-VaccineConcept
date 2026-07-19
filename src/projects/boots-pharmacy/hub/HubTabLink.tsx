import {
  studioScreenAtTab,
  studioTabToIndex,
} from "@/projects/boots-pharmacy/screens/screens";

type Props = {
  tab: number;
  onGoToTab: (screenIndex: number) => void;
  children?: React.ReactNode;
  className?: string;
  showLabel?: boolean;
};

export default function HubTabLink({
  tab,
  onGoToTab,
  children,
  className,
  showLabel = false,
}: Props) {
  const screen = studioScreenAtTab(tab);
  const label = screen?.label ?? `Screen ${tab}`;

  return (
    <button
      type="button"
      className={
        className ? `proto-hub-tab-link ${className}` : "proto-hub-tab-link"
      }
      onClick={() => onGoToTab(studioTabToIndex(tab))}
      title={`Open tab ${tab}: ${label}`}
    >
      {children ?? (
        <>
          <span className="proto-hub-tab-link__badge">{tab}</span>
          {showLabel ? (
            <span className="proto-hub-tab-link__label">{label}</span>
          ) : null}
        </>
      )}
    </button>
  );
}
