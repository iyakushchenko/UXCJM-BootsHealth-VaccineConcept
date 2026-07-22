# FE/UI/UX audit — universal REC/playback interaction contract

**Date:** 2026-07-22
**Result:** **PROVEN**
**Scope:** engine target truth, REC arm/capture, cursor playback, QA diagnostics, migration compatibility.

## Strict findings

- **No CJM rescue branches:** target/state rules live in shared `src/app/scenario/` and `src/app/recording/`; no journey ID, persona, or fixed route order changes validity.
- **Target truth:** ghost/non-semantic boxes, disabled controls, selected idempotent options, modal click-through, cursor misses, and unchanged stateful controls fail before PASS. Checkboxes/switches are valid toggles only when checked state changes.
- **Visual targeting:** wide links/buttons aim at visible text rather than empty full-width geometry; cursor remains the one shared REC/playback engine.
- **Capture truth:** trusted human capture rejects selected no-ops before persistence; agent capture uses the same robo-cursor and records only verified actions.
- **Readiness:** fast playback compresses presentation timing but keeps wall-clock DOM readiness polling, preventing false mount races.
- **Runtime lifecycle:** REC state is shared across HMR; stale active/paused drafts are stopped before a new arm; CREATE NEW resolves the semantic Orchestra control instead of stale sibling menu nodes.
- **Migration contract:** layout may change, but screen IDs, action intent, modal ownership, and observable selected/checked state remain compatible or the CJM must be explicitly re-proven/re-recorded.

## Localhost evidence

- Fresh agent REC + exact playback: `rec-trad-mrvkgcks-lwjf` — **PASS**, 14/14; 22 raw events; playback contract v2; author Agent; Guest + user auth.
- Autonomous QA **Fast test current CJM** — **PASS** in 5.7s, exact 14/14 peak.
- Built-in Agentic fast full-play — **PASS**, 22/22.
- Built-in Traditional logged-in route — **PASS**, 10/10.
- Prior 46-step recording — correctly **FAIL**, `already-selected option is not a valid target`; it was not rescued or silently skipped.
- Console: no application runtime error from the prove; only browser favicon request noise and expected QA leave latch warning.

## Gate evidence

- Full repository: **11/11 static gates**, **147/147 test files**, and **863/863 tests PASS** with no unhandled errors.
- Production build: **PASS** (840 modules transformed).
- Focused interaction/REC/QA suites: **PASS**.
