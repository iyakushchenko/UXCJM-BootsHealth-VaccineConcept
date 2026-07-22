import { describe, expect, it } from "vitest";
import { buildRecordingTimeline } from "@/app/shell/agent-testing/agentTestingRecordingTimeline";
import type { RecordingSession } from "@/app/recording/recordingTypes";

function session(events: RecordingSession["events"]): RecordingSession {
  return {
    id: "rec-test",
    version: 1,
    startedAt: new Date(0).toISOString(),
    events,
  };
}

describe("buildRecordingTimeline", () => {
  it("shows a useful empty REC state", () => {
    expect(buildRecordingTimeline(session([]))).toEqual({
      stepCount: 0,
      items: [{ key: "Waiting for first action", outcome: "pending" }],
    });
  });

  it("shows recorded actions and coalesces click navigation", () => {
    const result = buildRecordingTimeline(
      session([
        { kind: "screen", screenId: "plp", atMs: 0 },
        { kind: "demo-click", element: "South-East Asia4", atMs: 50 },
        { kind: "demo-click", element: "Book now", atMs: 100 },
        { kind: "screen", screenId: "pdp", atMs: 400 },
        {
          kind: "typed-text",
          element: "Location search",
          value: "London",
          atMs: 1500,
        },
      ]),
    );

    expect(result.stepCount).toBe(4);
    expect(result.items.map((item) => item.key)).toEqual([
      "Vaccinations",
      "South-East Asia",
      "Book now",
      "Type · Location search",
    ]);
    expect(result.items.every((item) => item.key !== "Current CJM")).toBe(true);
  });
});
