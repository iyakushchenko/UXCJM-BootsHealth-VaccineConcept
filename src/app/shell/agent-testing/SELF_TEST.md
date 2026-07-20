# QA overlay — dual-role self-test (restartable)

**Prove URL:** `http://127.0.0.1:5173/` only (`strictPort`).  
**Catalog:** [`agentTestingSelfTest.scenarios.ts`](./agentTestingSelfTest.scenarios.ts)  
**Lean runner:** `window.__studioRunQaSelfTestSmoke?.()` → pure session checks + short DOM probe.  
**Doctrine:** [PAINPOINTS.md](../../../../docs/product/PAINPOINTS.md) **PP-13** · [README.md](./README.md)

The QA overlay is **load-bearing** for mid-flight agent work. Do not claim Studio/product green without a recent self-test when the overlay changed.

---

## Dual roles (same machine, sequential)

### USER (Observe)
```js
window.__studioForceClearAgentTestingOverlay?.()
window.__studioOpenQaLogger?.({ kind: "observe" })
// CAPTURE is on — click concept pages freely; Studio nav stays usable
// Alarm = escalate to agent + latch (not hidden)
// Close × dismisses; bug icon does NOT close observe
```

### AGENT
```js
window.__studioAskUserInQa?.("Does Book now look right?")
// User replies via Message/Send → clears PENDING
window.__studioAgentTestingOverlay?.unlockObserve?.() // after observe→agent escalate
window.__studioQaHandoff?.({ oversee: true })  // keep notes
window.__studioQaHandoff?.({ oversee: false }) // wipe → agent
window.__studioPeekPoSignal?.() / __studioConsumePoSignal?.()
```

---

## Scenario checklist (trust = must PASS)

| ID | Trust | How to prove |
|----|-------|--------------|
| observe-open-capture | Y | Observe open → `Observing` + MCP OBSERVE after ~800ms flash |
| observe-page-click-log | Y | Quick View click → `Click: …` row (Studio tabs ignored by design) |
| observe-alarm-escalate | Y | Alarm → agent + `ALARM_SEQUENCE_MISMATCH` latch |
| observe-unlock | Y | `unlockObserve()` → observe |
| ask-pending-reply | Y | Ask → PENDING; reply → CONTROL/OBSERVE not PENDING |
| handoff-oversee-keeps-note | Y | Note then `handoff({oversee:true})` — note remains in ring |
| handoff-wipe-clears-note | Y | Note then `handoff({oversee:false})` — note gone |
| refresh-mid-control | Y | Agent + ask → reload → AGENT + PENDING |
| refresh-mid-observe | Y | Observe → reload → OBSERVE |
| control-border-under-modal | Y | Agent + Quick View/avail → gold inset on capture |
| rec-xor-keeps-overlay | Y | REC toggle leaves overlay `active` |
| empty-message-noop | N | Whitespace Message → no row |
| bug-toggle-observe-noop | Y | `__studioToggleQaLogger` while observe → stays open |

---

## Exhaustion / confidence

Re-run **different** dual-role waves until last 2–3 waves find only nits.  
Known nits (not trust-breakers): Studio nav clicks omitted from capture log; CONNECTING/CONNECTED flash before OBSERVE/CONTROL settle (~0.8s).

```js
const r = await window.__studioRunQaSelfTestSmoke?.()
console.table(r?.checks)
// r.ok === true → pure+DOM trust smoke green; still walk SELF_TEST table for marathon
```
