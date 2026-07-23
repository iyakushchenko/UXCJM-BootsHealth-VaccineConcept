/**
 * @vitest-environment happy-dom
 *
 * Bug: picking CREATE NEW CJM (menu click or imperative selector) left a
 * stale/completed recording session (`getLastRecordingSession()`) mounted —
 * the REC STEPS counter (`StudioNavRecordingEventCounter` /
 * `countRecordingSteps`) then showed an old count (e.g. 10) instead of 0 for
 * the brand-new, empty CJM. Fresh CREATE NEW selection must discard that
 * leftover staged session (never a live/paused one).
 */
import React, { act, useState } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, it, vi } from "vitest";
import { StudioNavJourneyMenu } from "@/app/nav/StudioNavJourneyMenu";
import { selectCreateNewCjm } from "@/app/recording/createNewCjmApi";
import {
  appendRecordingEvent,
  countRecordingSteps,
  getLastRecordingSession,
  resetRecordingSessionForTests,
  startRecording,
  stopRecording,
} from "@/app/recording/recordingSession";

(globalThis as typeof globalThis & { React: typeof React; IS_REACT_ACT_ENVIRONMENT: boolean }).React = React;
(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const MODES = [{ id: "agentic-cjm" as const, label: "Agentic CJM" }];

function stageStalePreviousRecording(): void {
  document.body.innerHTML = `<button role="switch" aria-label="REC on" aria-checked="true"></button>`;
  startRecording({ projectId: "boots-pharmacy" });
  for (let i = 0; i < 10; i++) {
    appendRecordingEvent({ kind: "screen", atMs: i * 200, screenId: `screen-${i}` });
  }
  stopRecording();
  document.body.innerHTML = "";
}

/** Controlled wrapper mirroring App.tsx's recMode + onRequestRecMode wiring. */
function TestWrapper() {
  const [recMode, setRecMode] = useState(false);
  return React.createElement(StudioNavJourneyMenu, {
    modes: MODES,
    value: "agentic-cjm",
    onChange: vi.fn(),
    recMode,
    onRequestRecMode: setRecMode,
  });
}

function openMenuAndClickCreateNew(host: HTMLElement): void {
  const trigger = host.querySelector<HTMLButtonElement>(
    '[data-studio-action="orchestra-mode-select"]'
  )!;
  act(() => {
    trigger.click();
  });
  const createNewOption = Array.from(
    host.querySelectorAll<HTMLElement>('[role="option"]')
  ).find((el) => /CREATE\s*NEW/i.test(el.textContent ?? ""))!;
  act(() => {
    createNewOption.click();
  });
}

describe("CREATE NEW CJM resets stale STEPS counter state", () => {
  afterEach(() => {
    document.body.innerHTML = "";
    resetRecordingSessionForTests();
    vi.restoreAllMocks();
  });

  it("clears a leftover staged recording (menu click) so STEPS starts at 0", () => {
    stageStalePreviousRecording();
    expect(countRecordingSteps(getLastRecordingSession()?.events)).toBe(10);

    const host = document.createElement("div");
    document.body.append(host);
    act(() => {
      createRoot(host).render(React.createElement(TestWrapper));
    });

    openMenuAndClickCreateNew(host);

    expect(getLastRecordingSession()).toBeNull();
    expect(countRecordingSteps(getLastRecordingSession()?.events)).toBe(0);
  });

  it("clears a leftover staged recording via the imperative selector (agent REC arm path)", () => {
    stageStalePreviousRecording();
    expect(countRecordingSteps(getLastRecordingSession()?.events)).toBe(10);

    const host = document.createElement("div");
    document.body.append(host);
    act(() => {
      createRoot(host).render(React.createElement(TestWrapper));
    });

    act(() => {
      expect(selectCreateNewCjm()).toBe(true);
    });

    expect(getLastRecordingSession()).toBeNull();
    expect(countRecordingSteps(getLastRecordingSession()?.events)).toBe(0);
  });

  it("does NOT discard a live recording — clear is a no-op while REC is active", () => {
    document.body.innerHTML = `<button role="switch" aria-label="REC on" aria-checked="true"></button>`;
    const live = startRecording({ projectId: "boots-pharmacy" });
    appendRecordingEvent({ kind: "screen", atMs: 0, screenId: "screen-0" });
    document.body.innerHTML = "";

    const host = document.createElement("div");
    document.body.append(host);
    act(() => {
      // recMode starts false — the fresh CREATE NEW click path (enteringFresh
      // = true) still runs, but the live session must survive it.
      createRoot(host).render(
        React.createElement(StudioNavJourneyMenu, {
          modes: MODES,
          value: "agentic-cjm",
          onChange: vi.fn(),
          recMode: false,
          onRequestRecMode: vi.fn(),
        })
      );
    });

    openMenuAndClickCreateNew(host);

    expect(live.id).toBeTruthy();
    expect(countRecordingSteps(live.events)).toBe(1);
  });
});
