/**
 * Lean in-panel PLAYBACK_DIAG mirror — last-N events when QA gate is open.
 */

import type { PlaybackDiagEvent } from "@/app/shell/playbackDiag";
import { getPlaybackDiagBundle } from "@/app/shell/playbackDiag";

export type DiagMirrorSeverity = "ok" | "warn" | "fail";

export type DiagMirrorRow = {
  kind: string;
  label: string;
  severity: DiagMirrorSeverity;
  t: number;
};

const DEFAULT_LIMIT = 6;

export function severityForDiagEvent(ev: PlaybackDiagEvent): DiagMirrorSeverity {
  if (ev.clickOk === false || ev.typeOk === false) return "fail";
  if (ev.kind === "hub-nav" || ev.kind === "skip") return "warn";
  if (ev.cursor?.onTarget === false) return "warn";
  if (
    typeof ev.detail === "string" &&
    /FAIL|JUMP|CHOP|ERROR|OFF-TARGET/i.test(ev.detail)
  ) {
    return "fail";
  }
  if (
    typeof ev.detail === "string" &&
    /warn|stale|interrupt|skip/i.test(ev.detail)
  ) {
    return "warn";
  }
  return "ok";
}

export function formatDiagMirrorLabel(ev: PlaybackDiagEvent): string {
  const bits = [
    ev.kind,
    ev.beatId ? `beat:${ev.beatId}` : null,
    ev.detail ? String(ev.detail).slice(0, 48) : null,
    ev.screenAfter ? `→${ev.screenAfter}` : null,
  ].filter(Boolean);
  return bits.join(" · ");
}

/** Last-N compact rows (newest last for DOM append order). */
export function getDiagMirrorRows(limit = DEFAULT_LIMIT): DiagMirrorRow[] {
  let events: PlaybackDiagEvent[] = [];
  try {
    events = getPlaybackDiagBundle().events ?? [];
  } catch {
    return [];
  }
  const slice = events.slice(-Math.max(1, limit));
  return slice.map((ev) => ({
    kind: ev.kind,
    label: formatDiagMirrorLabel(ev),
    severity: severityForDiagEvent(ev),
    t: ev.t,
  }));
}

/** Render into an existing `<ol class="…__diag-mirror">` host. */
export function renderDiagMirrorDom(
  host: HTMLElement | null,
  rows: DiagMirrorRow[] = getDiagMirrorRows()
): void {
  if (!host) return;
  host.replaceChildren();
  if (rows.length === 0) {
    host.dataset.empty = "true";
    const empty = document.createElement("li");
    empty.className = "studio-agent-testing-overlay__diag-mirror-empty";
    empty.textContent = "No PLAYBACK_DIAG yet";
    host.appendChild(empty);
    return;
  }
  delete host.dataset.empty;
  for (const row of rows) {
    const li = document.createElement("li");
    li.dataset.severity = row.severity;
    li.dataset.kind = row.kind;
    li.textContent = row.label;
    host.appendChild(li);
  }
}
