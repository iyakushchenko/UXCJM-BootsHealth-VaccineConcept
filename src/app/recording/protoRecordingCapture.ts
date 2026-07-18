import type { JourneyBeatActionId } from "@/app/orchestra/types";
import {
  appendRecordingEventWithSnapshot,
  getActiveRecordingSession,
} from "@/app/recording/protoRecordingSession";
import type {
  ProtoRecordedEvent,
  ProtoRecordingSnapshot,
} from "@/app/recording/protoRecordingTypes";
import type {
  ManualTransportAction,
  PlaybackInteractionRecord,
} from "@/app/shell/protoPlaybackInteractionContext";

let snapshotProvider: (() => ProtoRecordingSnapshot | undefined) | null = null;
let lastTouchpointKey: string | undefined;

export function registerRecordingSnapshotProvider(
  provider: (() => ProtoRecordingSnapshot | undefined) | null
): void {
  snapshotProvider = provider;
}

export function getRecordingSnapshot(): ProtoRecordingSnapshot | undefined {
  return snapshotProvider?.();
}

/** Build a selector chain from demo-click target for future replay. */
export function buildPlaybackSelectorChain(el: HTMLElement): string[] {
  const chain: string[] = [];
  let node: HTMLElement | null = el;

  while (node && chain.length < 6) {
    const tag = node.tagName.toLowerCase();
    const dataName = node.getAttribute("data-name");
    const protoAvail = node.getAttribute("data-proto-avail-store");
    const protoBeat = node.getAttribute("data-proto-beat");
    const protoAction = node.getAttribute("data-proto-action");

    if (protoAction) chain.unshift(`[data-proto-action="${protoAction}"]`);
    if (protoBeat) chain.unshift(`[data-proto-beat="${protoBeat}"]`);
    if (protoAvail) chain.unshift(`[data-proto-avail-store="${protoAvail}"]`);
    if (dataName) chain.unshift(`[data-name="${dataName}"]`);

    if (chain.length === 0 && tag) {
      const id = node.id;
      if (id) chain.unshift(`#${id}`);
    }

    node = node.parentElement;
  }

  return [...new Set(chain)];
}

export function captureRecordingEvent(
  event: Omit<ProtoRecordedEvent, "atMs" | "snapshot"> & {
    atMs?: number;
    snapshot?: ProtoRecordingSnapshot;
  }
): void {
  appendRecordingEventWithSnapshot(event, () => snapshotProvider?.());
}

export function captureTouchpointChange(options: {
  touchpointKey: string;
  beatId?: string;
  label?: string;
  counter?: string | null;
}): void {
  if (!getActiveRecordingSession()) return;
  if (lastTouchpointKey === options.touchpointKey) return;
  lastTouchpointKey = options.touchpointKey;

  captureRecordingEvent({
    kind: "touchpoint",
    touchpointKey: options.touchpointKey,
    beatId: options.beatId,
    label: options.label,
    counter: options.counter,
  });
}

export function captureWireIntent(
  intentId: JourneyBeatActionId | string,
  payload?: Record<string, unknown>
): void {
  captureRecordingEvent({
    kind: "wire-intent",
    intentId,
    payload,
  });
}

export function captureScroll(options: {
  scrollTop?: number;
  anchorSelector?: string;
}): void {
  captureRecordingEvent({
    kind: "scroll",
    scrollTop: options.scrollTop,
    anchorSelector: options.anchorSelector,
  });
}

export function captureStudioChange(
  field: "journey-mode" | "orchestra-mode" | "project" | "persona",
  value: string | boolean
): void {
  captureRecordingEvent({
    kind: "studio",
    field,
    value,
  });
}

export function captureDwell(durationMs?: number): void {
  captureRecordingEvent({
    kind: "dwell",
    durationMs,
  });
}

/** Bridge from protoPlaybackInteractionContext — maps diagnostic records to recording events. */
export function notifyRecordingFromInteraction(
  interaction: PlaybackInteractionRecord
): void {
  if (!getActiveRecordingSession()) return;
  if (interaction.kind === "demo-click") return;

  const snapshot = snapshotProvider?.();
  const base = { atMs: interaction.atMs, snapshot };

  switch (interaction.kind) {
    case "transport": {
      const action = parseTransportAction(interaction.label);
      if (action) {
        captureRecordingEvent({ kind: "transport", action, ...base });
      }
      break;
    }
    case "director-manual":
    case "director-auto":
      if (interaction.scriptId) {
        captureRecordingEvent({
          kind: "director-script",
          scriptId: interaction.scriptId,
          beatId: interaction.beatId,
          manual: interaction.kind === "director-manual",
          ...base,
        });
      }
      break;
    case "beat-enter":
      captureRecordingEvent({
        kind: "beat-enter",
        actionId: interaction.scriptId ?? interaction.label,
        beatId: interaction.beatId,
        ...base,
      });
      break;
    case "retreat-sync":
      captureRecordingEvent({
        kind: "wire-intent",
        intentId: "retreat-sync",
        payload: {
          beatId: interaction.beatId,
          scriptId: interaction.scriptId,
        },
        ...base,
      });
      break;
    default:
      break;
  }
}

/** Extended demo-click capture with DOM selector chain. */
export function notifyRecordingDemoClick(
  target: HTMLElement,
  elementDescriptor: string
): void {
  if (!getActiveRecordingSession()) return;
  const snapshot = snapshotProvider?.();

  captureRecordingEvent({
    kind: "demo-click",
    element: elementDescriptor,
    selectorChain: buildPlaybackSelectorChain(target),
    beatId: snapshot?.beatId,
    touchpointKey: snapshot?.touchpointKey,
  });
}

function parseTransportAction(label: string): ManualTransportAction | null {
  if (label.includes("Step forward")) return "step-forward";
  if (label.includes("Step back")) return "step-back";
  if (label.includes("Jump to start")) return "jump-to-start";
  if (label.includes("Jump to end")) return "jump-to-end";
  if (label.includes("Play")) return "play";
  return null;
}

/** Test-only — resets capture-side state. */
export function resetRecordingCaptureForTests(): void {
  snapshotProvider = null;
  lastTouchpointKey = undefined;
}
