# PLAYBACK_DIAG — console contract

**Status:** Locked (PO 2026-07-19) — CJM type-in / step / retreat regressions must be checkable from the console every night.  
**Owners:** Finn (wire) · Quinn (prove) · Ben (MCP helpers) · Arch (Auto-Rule)  
**Code:** `src/app/shell/playbackDiag.ts`  
**Related:** [PLAYBACK.md](./PLAYBACK.md) · [RECORDING.md](./RECORDING.md) · [STUDIO_AUTO_RULES.md](../product/STUDIO_AUTO_RULES.md) R13

---

## Why

React Site Pilot / Chat migration broke CJM playback in silent ways:

| Failure | Symptom | Root cause |
|---------|---------|------------|
| Type-in missing | Step jumps home→chat with no typing | Prefill `HOME_QUERY_DEFAULT === AGENTIC_HOME_DEMO_QUERY` skipped type-in |
| Make-retired selectors | `diagnostic-on-step-1` / transport-no-op | Hidden Make DOM wins `querySelector` |
| Scroll host | Wrong scroll / sticky pad | Chat sole host is `.chat__column` |
| Fade removed | Bubbles hard-edge under bar / composer | Composer + under-bar wash dropped |

**Rule:** Prefer under-match Make over inventing chrome — but **do not** skip director type-in for convenience.

---

## Console APIs (prefer `__studio*`)

```js
window.__studioPlaybackDiagClear?.()
// … step / play CJM …
window.__studioPlaybackDiag?.()
// → { events, typeIn: { starts, ends, skips, progressSamples }, step: { forwards, backs, retreatSyncs } }

window.__studioAssertTypeIn?.()
// → { pass, reason?, bundle }  — FAIL if type-in-skip or too few progress samples

// Legacy aliases (same functions):
window.__protoPlaybackDiag?.()
window.__protoAssertTypeIn?.()
```

Filter DevTools console: `[PLAYBACK_DIAG]`.

---

## Companion diags (always use together)

| API | Role |
|-----|------|
| `__studioPlaybackDiag` / `__studioAssertTypeIn` | Type-in + step/retreat event log |
| `__studioCursorDiagnostics` | Robo-cursor path / park |
| `__protoStudioState` | Beat / counter / diagnosticOpen |
| `__protoRunAgenticStepForwardSmoke` | Full agentic step matrix |
| `__protoRunTraditionalStepForwardSmoke` | Traditional step matrix |
| `__protoRunRetreatSmoke` / `__protoRunTraditionalRetreatSmoke` | Retreat |
| `__studioAgentTestingOverlay` | Visible prove panel ([RECORDING.md](./RECORDING.md)) |
| `__studioCursorDiagnostics` + scroll reveal | Camera / scroll host |

**Note:** `__protoTriggerTransport` requires an active MCP session (`__protoRun*` / recording). UI Step buttons always work; for console step use a smoke runner or click the nav button.

---

## Prove recipe (R11 — reuse `:5173` tab)

```js
window.__studioAgentTestingOverlay?.touch?.()
window.__studioPlaybackDiagClear?.()

// Site Pilot type-in (agentic CJM on):
// Jump to start → Step forward once → watch textarea grow → then:
window.__studioAssertTypeIn?.({ minSamples: 3, minChars: 8 })

// Full matrices:
await window.__protoRunAgenticStepForwardSmoke?.({ timeoutMs: 600_000 })
await window.__protoRunRetreatSmoke?.()
await window.__protoRunTraditionalStepForwardSmoke?.()
await window.__protoRunTraditionalRetreatSmoke?.()
```

**Traditional settle (2026-07-19):** After each Step, wait until transport is idle (`!isOnAir && !isPlaying`). Login chains into `book-location-pick` — early Step aborts mid-picker → stray Availability on `book-step2`.

PASS criteria:

1. No `diagnostic-on-step-1` / no playback diagnostic card mid-smoke  
2. `__studioAssertTypeIn()` PASS on agentic home step  
3. Retreat smoke PASS (agentic + traditional)  
4. Chat: top fade under SitePilot bar + composer-edge fade; sticky pad; scrollIntoView host `.chat__column`

---

## Auto-Rule

**R13 `playback-diag`** — document + window APIs must exist; type-in skip is a FAIL class. See [STUDIO_AUTO_RULES.md](../product/STUDIO_AUTO_RULES.md).
