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
import { REC_MODE_OFF_REFUSE_MESSAGE } from "@/app/recording/studioRecModeDom";

function mountRecSwitch(on: boolean): void {
  document.body.innerHTML = `
    <button role="switch" aria-label="${on ? "REC on" : "REC off"}" aria-checked="${on ? "true" : "false"}"></button>
  `;
}

describe("assertRecLive + startRecording gate", () => {
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

  it("refuses startRecording when REC switch is off", () => {
    mountRecSwitch(false);
    expect(() => startRecording({ projectId: "boots-pharmacy" })).toThrow(
      REC_MODE_OFF_REFUSE_MESSAGE
    );
  });

  it("FAILs assert when REC switch is off even if we somehow had chrome", () => {
    document.body.innerHTML = `
      <button role="switch" aria-label="REC off" aria-checked="false"></button>
      <div data-studio-playback-panel="true"></div>
    `;
    const result = assertRecLive();
    expect(result.ok).toBe(false);
    expect(result.recMode).toBe(false);
    expect(result.reason).toMatch(/REC switch/i);
  });

  it("PASSes when REC switch ON, no playback panel, and session live", () => {
    document.body.innerHTML = `
      <button role="switch" aria-label="REC on" aria-checked="true"></button>
      <button aria-label="Orchestra mode">CREATE NEW CJM</button>
      <button aria-label="Start recording"></button>
    `;
    startRecording({ projectId: "boots-pharmacy" });
    const result = assertRecLive();
    expect(result.ok).toBe(true);
    expect(result.recMode).toBe(true);
    expect(result.recording).toBe(true);
    expect(result.playbackPanel).toBe(false);
  });
});
