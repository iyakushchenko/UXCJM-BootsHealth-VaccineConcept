# Agent testing — mid-flight QA shell

**Refs:** [PLAYBACK_DIAG.md](../../../../docs/shell/PLAYBACK_DIAG.md) · [STUDIO_AUTO_RULES.md](../../../../docs/product/STUDIO_AUTO_RULES.md) R15 · [TEAM.md](../../../../docs/product/TEAM.md) · [PAINPOINTS.md](../../../../docs/product/PAINPOINTS.md) PP-10…PP-12

## Overlay CTAs (PO mid-flight)

| CTA | Meaning | Latch code |
|-----|---------|------------|
| **Alarm** | Sequence / expected-steps mismatch | `ALARM_SEQUENCE_MISMATCH` |
| **Cursor** | Cursor weird / invisible / wrong | `CURSOR_WEIRD_FLAG` (manual) · `CURSOR_HIDDEN_DURING_TYPEIN` (auto) |
| **Scroll** | Scroll path / intoView issue | `SCROLL_ISSUE_REPORTED` (+ auto soft-logs) |

Primary: `window.__studioAgentTestingTakeover` / `__studioConsumePoSignal()`. Dump secondary.

## QA diag gate / free-form logger

- Version-chip **amber BUG** icon **toggles** **MANUAL TEST** (`toggleLogger`) — open or **close + stop capture**. Idle chip muted; active while manual popup open.
- Agent `touch` / `start` → **AGENT TESTING** — **locked** (no close/reset; header bug disabled).
- **Pause / Resume** (clock + capture): Pause freezes elapsed; agent also `haltPlaybackForPoSignal("po-pause")`. Explicit Resume (no auto-Play). Manual opens **paused** at 0:00.
- While capturing: **page clicks** + **screen nav** appear in the visible log (`Click: …`, `Screen → …`); full detail stays in ring/dump.
- Log colors: capture muted · system/control **blue** · user message **amber** · alarms/errors warn · init muted accent. Warm-up collapses to one **Initializing…** row.
- **Session** bar (mode / project / persona / CJM) separate from **Touchpoints** strip.
- **Close (×)** stops capture (same as bug icon). **Reset** clears log/ring/timer (`Session reset`).
- **Save Log**: disabled while capturing; enabled when paused / idle / settled.

See [PLAYBACK_DIAG.md](../../../../docs/shell/PLAYBACK_DIAG.md) § QA diag gate.

## Official overlay test & bugfix process (HARD)

When PO clicks Alarm / Cursor / Scroll during a watched MCP / smoke session:

1. **STOP Play immediately** in the same click (`haltPlaybackForPoSignal` → journey/scenario abort — not next smoke poll).
2. **Latch** stays for `__studioConsumePoSignal` / smoke abort + `diagSnapshot`.
3. **Understand** from `diagSnapshot` + `[PLAYBACK_DIAG]`. If unclear → **ask PO** (do not invent).
4. **FIX** → **RESTART** → prove that exact issue gone.
5. Continue until next signal or green end.

**PLAYBACK DIAGNOSTIC Cancel** (Scroll/camera jank, etc.): same hard-stop + latch `DIAGNOSTIC_ACK_STOP`. Modal must close in that click. Smoke harness `__protoDismissPlaybackDiagnostic` clears UI without that latch.

## Type-in cursor (CJM)

CJM on ⇒ robo-cursor stays visible during typed-text (`parkDemoCursorForTypeIn` / `typeInCursorGuard`). Hidden mid type-in → `CURSOR_HIDDEN_DURING_TYPEIN`.
