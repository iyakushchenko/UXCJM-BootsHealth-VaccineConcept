# Agent testing — mid-flight QA shell

**Refs:** [PLAYBACK_DIAG.md](../../../../docs/shell/PLAYBACK_DIAG.md) · [STUDIO_AUTO_RULES.md](../../../../docs/product/STUDIO_AUTO_RULES.md) R15 · [TEAM.md](../../../../docs/product/TEAM.md) · [PAINPOINTS.md](../../../../docs/product/PAINPOINTS.md) PP-10…PP-12

## Overlay CTAs (PO mid-flight)

| CTA | Meaning | Latch code |
|-----|---------|------------|
| **Alarm** | Sequence / expected-steps mismatch | `ALARM_SEQUENCE_MISMATCH` |
| **Cursor** | Cursor weird / invisible / wrong | `CURSOR_WEIRD_FLAG` (manual) · `CURSOR_HIDDEN_DURING_TYPEIN` (auto) |
| **Scroll** | Scroll path / intoView issue | `SCROLL_ISSUE_REPORTED` (+ auto soft-logs) |

Primary: `window.__studioAgentTestingTakeover` / `__studioConsumePoSignal()`. Dump secondary.

## Official overlay test & bugfix process (HARD)

When PO clicks Alarm / Cursor / Scroll during a watched MCP / smoke session:

1. **STOP** immediately (smoke aborts with structured fail + `diagSnapshot`).
2. **Understand** the issue from `diagSnapshot` + `[PLAYBACK_DIAG]` console.  
   - If the agent does **not** know exactly what was wrong → **ask PO for follow-up details before guessing**.  
   - **Do not invent the bug.**
3. **FIX** the reported issue.
4. **RESTART** the test and **prove that exact issue is gone**.
5. Continue the journey until the next PO signal or green end.

Not “log and move on.” Not “report only.” Smokes cannot auto-fix — the orchestrator session owns the loop.

## Type-in cursor (CJM)

CJM on ⇒ robo-cursor stays visible during typed-text (`parkDemoCursorForTypeIn` / `typeInCursorGuard`). Hidden mid type-in → `CURSOR_HIDDEN_DURING_TYPEIN`.
