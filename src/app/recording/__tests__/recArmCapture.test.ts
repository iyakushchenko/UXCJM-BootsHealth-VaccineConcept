/**
 * @vitest-environment happy-dom
 */
import { describe, expect, it, beforeEach, afterEach } from "vitest";
import { assertRecLive } from "@/app/recording/recArmCapture";
import {
  clearStagedRecordingSession,
  startRecording,
  stopRecording,
} from "@/app/recording/recordingSession";

describe("assertRecLive", () => {
  beforeEach(() => {
    stopRecording();
    clearStagedRecordingSession();
    document.body.innerHTML = "";
  });

  afterEach(() => {
    stopRecording();
    clearStagedRecordingSession();
    document.body.innerHTML = "";
  });

  it("FAILs when REC switch is off even if session is live", () => {
    startRecording({ projectId: "boots-pharmacy" });
    document.body.innerHTML = `
      <button role="switch" aria-label="REC off" aria-checked="false"></button>
    `;
    const result = assertRecLive();
    expect(result.ok).toBe(false);
    expect(result.recording).toBe(true);
    expect(result.recMode).toBe(false);
    expect(result.reason).toMatch(/REC switch/i);
  });

  it("PASSes when REC switch ON and session live", () => {
    startRecording({ projectId: "boots-pharmacy" });
    document.body.innerHTML = `
      <button role="switch" aria-label="REC on" aria-checked="true"></button>
      <button aria-label="Orchestra mode">CREATE NEW CJM</button>
    `;
    const result = assertRecLive();
    expect(result.ok).toBe(true);
    expect(result.recMode).toBe(true);
    expect(result.recording).toBe(true);
  });
});
