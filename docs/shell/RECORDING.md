# Journey recording (foundation)

Foundation for **record → export → replay → compile** without a studio UI panel yet. Events compile to the same beat/action model the playback engine uses.

See also: [PLAYBACK.md](./PLAYBACK.md) (engine), [SHELL.md](./SHELL.md) (shell architecture).

---

## Architecture

```
User / MCP transport + demo cursor
       ↓
protoPlaybackInteractionContext   (existing flight recorder)
       ↓
protoRecordingCapture             (bridge + touchpoint hook in App.tsx)
       ↓
protoRecordingSession             (in-memory session + JSON export)
       ↓
protoRecordingReplay              (v1 transport replay; v2 demo-click / wire-intent)
       ↓
compileRecordingToBeatTimeline    (future journeys.ts compiler input)
```

| Module | Path | Owns |
|--------|------|------|
| **Types** | `app/recording/protoRecordingTypes.ts` | Event union, session shape, replay options |
| **Session** | `app/recording/protoRecordingSession.ts` | start/stop/pause, append, serialize |
| **Capture** | `app/recording/protoRecordingCapture.ts` | Snapshot provider, interaction bridge, touchpoint |
| **Replay** | `app/recording/protoRecordingReplay.ts` | `replayRecordingSession`, `compileRecordingToBeatTimeline` |
| **MCP** | `app/recording/protoRecordingMcpHelpers.ts` | `window.__protoStartRecording` etc. |

---

## Event types

| Kind | Captured from | v1 replay |
|------|---------------|-----------|
| `transport` | Step/Play/Jump via `notePlaybackTransport` | Yes |
| `touchpoint` | Touchpoint key change in `App.tsx` | Boundary marker only |
| `demo-click` | Robo-cursor via `notePlaybackDemoClick` | No (selector chain stored) |
| `director-script` | Journey director via `notePlaybackDirectorScript` | No |
| `beat-enter` | Beat onEnter via `notePlaybackBeatEnter` | No |
| `wire-intent` | Retreat sync / future beat actions | No |
| `studio` | Journey/orchestra mode changes (manual API) | No |
| `scroll` | Manual API | No |
| `dwell` | Manual API or compiled pauses | Yes (delay) |

Each event may include a `snapshot` (`PlaybackStudioSnapshot` + journey/orchestra fields).

---

## Start / stop via MCP

```javascript
window.__protoEnsureCleanStudio?.()
window.__protoStartRecording?.()          // uses current project/persona/journey
window.__protoTriggerTransport?.('step-forward')
// … navigate freely …
window.__protoStopRecording?.()
window.__protoExportRecording?.()         // JSON string — copy to file
window.__protoCompileRecording?.()        // beat segments from touchpoint markers
```

Import a saved session:

```javascript
window.__protoImportRecording?.(jsonString)
```

---

## v1 vs future

| v1 (now) | v2+ |
|----------|-----|
| In-memory session + JSON export | Recording UI panel |
| Transport + dwell replay | Demo-click replay via `simulateDemoPointerClick` |
| Touchpoint boundary compilation | Full compile to `journeys.ts` beats |
| Capture via existing hooks | Wire-intent replay via `runBeatAction` |
| MCP helpers | Retreat-aware replay matrix |

---

## Recordable DOM conventions

Prefer stable selectors on interactive targets:

- `data-name="…"` — primary wire target (Figma export names)
- `data-proto-avail-store="…"` — availability store rows
- `data-proto-action="…"` — explicit playback actions (future)
- `data-proto-beat="…"` — beat-scoped controls (future)

Demo clicks store a **selector chain** (nearest `data-proto-*` / `data-name` ancestors) for future replay targeting.

---

## Tests

```bash
npm test -- src/app/recording
```

Run full suite after capture/replay changes: `npm test`.
