# UX Studio — Product testing strategy

**Owner:** Arch (Director) · Quinn (QA) · Finn (FE) · Uma (UI)  
**Prove URL:** `http://127.0.0.1:5173/` only (`strictPort`) — reuse MCP tab.  
**Related:** [SELF_TEST.md](../../src/app/shell/agent-testing/SELF_TEST.md) · [PAINPOINTS.md](./PAINPOINTS.md) · [PLAYBACK_DIAG.md](../shell/PLAYBACK_DIAG.md) · [NEXT_STEPS.md](./NEXT_STEPS.md)

Living contract for **product testing campaigns**: QA tool × page × nav × CJM modes.  
**Rule:** stop → fix → recheck. Never claim green without MCP / overlay evidence.

---

## Trust gate (must be green before product matrix)

| # | Gate | How |
|---|------|-----|
| 1 | QA self-test | `await __studioRunQaSelfTestSmoke()` → `ok: true` (catalog ≥20; includes pause/capture, freeze, Session origin, RESULT seal) |
| 2 | Chat bubble SF | `await __studioRunChatBubbleMotionSelfTest()` → jumps≈0 |
| 3 | No leftover diagnostic modal | after each wave: `__studioIsPlaybackDiagnosticOpen() === false` |
| 4 | QA action sitrep | Save Log / Pause / Close / Reset appear as `QA ·` / `Save Log ·` rows |

If any FAIL → **stop campaign**, fix, re-run gate.

---

## Mode axes

| Axis | Values |
|------|--------|
| Experience | `agentic` · `traditional` |
| CJM | `on` · `off` |
| QA session | `observe` · `agent` · `manual` |
| Transport | Step-forward (SF) · Play · idle browse |
| REC | off · armed · live (observe must preserve) |
| Screen sample | `site-pilot` · `chat` · `book-step-1` · PLP/PDP if mounted |

URL shape: `?project=boots-pharmacy&screen=<id>&persona=sarah-jenkins&cjm=on|off&experience=agentic|traditional`

---

## Matrix (campaign minimum)

Run lean cells first (★). Expand when ★ green.

| ID | QA | Screen | CJM | Exp | Transport | Assert |
|----|----|--------|-----|-----|-----------|--------|
| M1★ | observe | site-pilot | on | agentic | SF ×3 | clicks log 1:1; MCP OBSERVE; no ghost after Close |
| M2★ | agent | chat | on | agentic | SF bubble path | bubble self-test OR SF to r1; Save Log has rows; no diag leak |
| M3★ | agent | chat | on | agentic | Play short | Pause halts; Message latches; Play ignored while Pause |
| M4★ | observe | site-pilot | on | traditional | SF ×2 | observe capture; Alarm escalates |
| M5 | agent | book-step-1 | on | agentic | SF | nav honesty; no invent hover |
| M6 | observe | chat | on | agentic | REC arm | REC preserves observe |
| M7 | agent | site-pilot | off | agentic | browse | CJM-off scroll OK; no Play required |
| M8 | manual | any | on | agentic | — | CAPTURE/Pause/Resume/Save Log/Reset/Close all logged |

**Pass criteria per cell:** no leftover `.studio-playback-diagnostic`; QA timeline shows toolbar actions; latch consume if Pause/Message/Alarm used; `__studioIsPlaybackDiagnosticOpen() === false` after wipe.

---

## Agent procedure (mid-flight)

1. Poll `__studioPeekPoSignal` / `__studioConsumePoSignal` each beat — do not flood-read chat.  
2. User Message → STOP → read → investigate → fix → reply in QA → proceed.  
3. Diagnostic open → consume / Ack; never click under modal.  
4. End of prove wave → `__studioClearStalePlaybackDiagnostic('prove-wave-end')` + forceClear.  
5. Dump `priorityHints[]` = cause before symptom.

---

## Campaign log template

```
Date: 2026-07-20
Tip: (see ship v0.0.92)
Gate: QA self-test PASS (12/12) | bubble PASS | leftover modal PASS | MCP lean filter PASS
Matrix: M1–M8 ALL PASS (observe/agent/manual · agentic/trad · CJM on/off · SF/Play · REC XOR · book-step-1)
PP: PP-17…20,23…28 COMPLETE; PP-13/15/16/21/22 WATCH with retest evidence
Blockers: none
```

```
Date: 2026-07-20
Tip: v0.0.100 PP-13 expand wave
Gate: QaSelfTestSmoke 28/28 PASS on :5173 (catalog 24; pause/freeze/Session/RTT/seal/stale-green/diag-mirror)
PP: PP-13 catalog expand; PP-07 stale-green detector; PP-15 live PLAYBACK_DIAG mirror
```

---

## Hygiene

- Batch push (R12) after coherent wave.  
- Update [PAINPOINTS.md](./PAINPOINTS.md) with evidence — no orphan sentiments.  
- Reflex: Knowledge improved after HARD-GREEN pages only.
