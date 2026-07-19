import HubPage from "@/projects/boots-pharmacy/hub/HubPage";

type Props = {
  onGoToTab: (screenIndex: number) => void;
};

/** Hub wiki — always mounted; visibility toggled in App. */
export default function HubViewport({ onGoToTab }: Props) {
  return <HubPage onGoToTab={onGoToTab} />;
}
