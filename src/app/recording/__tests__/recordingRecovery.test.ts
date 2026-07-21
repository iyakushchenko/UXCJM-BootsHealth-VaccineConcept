/**
 * @vitest-environment happy-dom
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

describe("recording refresh recovery", () => {
  beforeEach(() => {
    sessionStorage.clear();
    document.body.innerHTML = `
      <button role="switch" aria-label="REC on" aria-checked="true"></button>
    `;
  });

  afterEach(() => {
    sessionStorage.clear();
    document.body.innerHTML = "";
    vi.resetModules();
  });

  it("restores a live draft paused after a module/page reload", async () => {
    const first = await import("@/app/recording/recordingSession");
    const started = first.startRecording({ projectId: "boots-pharmacy" });
    first.appendRecordingEvent({
      kind: "dwell",
      atMs: 10,
      durationMs: 500,
    });

    vi.resetModules();
    const restored = await import("@/app/recording/recordingSession");
    expect(restored.isRecordingActive()).toBe(false);
    expect(restored.isRecordingPaused()).toBe(true);
    expect(restored.getActiveRecordingSession()?.id).toBe(started.id);
    expect(restored.getActiveRecordingSession()?.events).toHaveLength(1);
  });

  it("adopts recovery persisted after the new page module initialized", async () => {
    const first = await import("@/app/recording/recordingSession");
    const started = first.startRecording({ projectId: "boots-pharmacy" });
    const latePayload = sessionStorage.getItem("studioRecordingRecoveryV1");
    expect(latePayload).toBeTruthy();

    sessionStorage.clear();
    vi.resetModules();
    const nextPage = await import("@/app/recording/recordingSession");
    expect(nextPage.getActiveRecordingSession()).toBeNull();

    sessionStorage.setItem("studioRecordingRecoveryV1", latePayload!);
    await new Promise((resolve) => window.setTimeout(resolve, 0));
    expect(nextPage.isRecordingPaused()).toBe(true);
    expect(nextPage.getActiveRecordingSession()?.id).toBe(started.id);
  });
});
