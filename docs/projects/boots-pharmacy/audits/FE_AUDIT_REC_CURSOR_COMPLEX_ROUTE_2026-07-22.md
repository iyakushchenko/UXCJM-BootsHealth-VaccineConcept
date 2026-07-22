# FE / UI / UX audit — visible REC cursor and complex route

**Date:** 2026-07-22
**Result:** **PROVEN**
**Scope:** REC touchpoint timeline, shared robo-cursor capture, nested Availability scrolling, recorded target identity, and exact recorded playback.

## Evidence

- Localhost REC used the shared `__studioSimulateDemoPointerClick` path for every interaction at normal user pace; no silent direct click path was used for the accepted recording.
- REC overlay displayed captured action names and `REC · N steps`; the stale `Current CJM` placeholder was absent.
- New journey `rec-trad-mrvina5r-1xna`, **Sarah · Location search backtracking to appointment details**, captured 50 raw events and compiled to 46 beats.
- Exact normal-speed playback reached **46/46**, with **28 successful clicks, 0 click failures, 0 skips, 196 cursor events, 47 parks, and 0 hidden-cursor events**. It traversed PLP → PDP → Availability list/map/backtracking/no-slots/date/time → Book → Confirmation → History → Details, then reset cleanly to PLP.
- Nested Availability scrolling brought the lower Strand target into view without moving the page behind the modal. Repeated `Choose Location` controls replayed against Covent Garden, Strand, and Piccadilly using recorded store identity.
- Repository verification: **854/854 tests passed** and the production build passed. No new console error was observed on the proven route.

## Strict checklist

| Audit rows | Result | Evidence |
|---|---|---|
| A1–A3, B1–B4, C1–C3, F1–F3, I1–I4 | PASS | No page or design-system CSS changed; the compact existing QA-shell pattern is preserved and the timeline only replaces incorrect content. |
| D1–D5 | PASS | Shared cursor preserved interactive hand/arrow semantics; 28/28 target activations passed. No control styling or focus behavior was replaced. |
| E1–E3 | PASS | Complex real route, modal backtracking, no-slots branch, booking, History, and Details all completed through genuine targets. |
| G1–G9 | PASS | REC overlay showed live capture state; exact CJM playback remained isolated from REC and finished/reset with correct 46/46 state. |
| H1–H3 | PASS | Full suite and build passed; no adjacent CSS or page layout was altered; live proof had zero click/cursor failures. |
| J1–J4 | N/A | This wave did not migrate or restyle a concept page. |
| J5–J6 | PASS | Localhost MCP proof covered the changed click, scroll, modal, target, and overlay-visible paths end to end. |

## Forecast / guardrail

Agent REC must remain a visible use of the shared cursor/camera engine. Silent protocol clicks, page-behind-modal scrolling, generic repeated selectors without entity identity, or remounting an already-open modal between beats are release-blocking regressions.

**Verdict:** **PROVEN** — no open UI, cursor, recording, or playback blocker remains in this slice.
