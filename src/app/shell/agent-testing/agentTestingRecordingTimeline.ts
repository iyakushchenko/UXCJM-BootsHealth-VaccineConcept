import { countRecordingSteps } from "@/app/recording/recordingSession";
import {
  humanizeRecordingLabel,
  humanizeScreenLabel,
} from "@/app/recording/recordingLabels";
import type {
  RecordedEvent,
  RecordingSession,
} from "@/app/recording/recordingTypes";
import type { AgentTestingTimelineKey } from "@/app/shell/agent-testing/agentTestingTypes";

const MAX_VISIBLE_REC_TOUCHPOINTS = 14;
const SCREEN_AFTER_CLICK_MS = 1000;

function cleanCapturedControlLabel(value: string): string {
  // Accessible names from filter controls can concatenate the visible result
  // count ("Indonesia3"). Keep semantic numbers such as "Step 2" intact.
  return value.replace(/([A-Za-z])\d+$/, "$1").trim();
}

function eventLabel(event: RecordedEvent): string | null {
  switch (event.kind) {
    case "screen":
      return humanizeScreenLabel(event.screenId);
    case "demo-click":
      return (
        cleanCapturedControlLabel(humanizeRecordingLabel(event.element)) ||
        "Activate control"
      );
    case "typed-text": {
      const target = humanizeRecordingLabel(event.element) || "field";
      return `Type · ${target}`;
    }
    case "scroll-stop":
      return humanizeRecordingLabel(
        event.anchorSelector ?? event.selectorChain?.at(-1) ?? "page",
        { camera: true },
      );
    case "touchpoint":
      return (
        humanizeRecordingLabel(event.label ?? event.touchpointKey) ||
        "Journey touchpoint"
      );
    case "wire-intent":
      return humanizeRecordingLabel(event.intentId) || "Product action";
    case "director-script":
      return humanizeRecordingLabel(event.scriptId) || "Scripted action";
    case "beat-enter":
      return humanizeRecordingLabel(event.actionId) || "Journey action";
    case "transport":
      return humanizeRecordingLabel(event.action) || "Transport action";
    default:
      return null;
  }
}

/** REC-mode timeline: captured human actions, never a stale QA suite label. */
export function buildRecordingTimeline(
  session: RecordingSession | null,
): {
  stepCount: number;
  items: AgentTestingTimelineKey[];
} {
  const events = session?.events ?? [];
  const labels: string[] = [];
  let lastDemoClickAt: number | null = null;

  for (const event of events) {
    if (event.kind === "demo-click") lastDemoClickAt = event.atMs;
    if (
      event.kind === "screen" &&
      lastDemoClickAt != null &&
      event.atMs >= lastDemoClickAt &&
      event.atMs - lastDemoClickAt <= SCREEN_AFTER_CLICK_MS
    ) {
      continue;
    }
    const label = eventLabel(event)?.trim();
    if (!label || labels.at(-1) === label) continue;
    labels.push(label);
  }

  const visible = labels.slice(-MAX_VISIBLE_REC_TOUCHPOINTS);
  return {
    stepCount: countRecordingSteps(events),
    items:
      visible.length > 0
        ? visible.map((key) => ({ key, outcome: "ok" as const }))
        : [{ key: "Waiting for first action", outcome: "pending" }],
  };
}
