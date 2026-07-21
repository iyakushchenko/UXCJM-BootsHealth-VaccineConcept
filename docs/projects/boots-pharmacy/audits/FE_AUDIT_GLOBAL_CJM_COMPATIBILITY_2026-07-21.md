# FE / UI / UX audit — Global CJM compatibility dialog

**Date:** 2026-07-21  
**Auditor:** Quinn (QA), independent strict interface audit  
**Surface:** global compatibility warning, diagnostics dialog, and QA-suite handoff  
**Verdict:** **PROVEN**  
**PO green-light allowed:** **Yes**

## Evidence

| Contract | Result | Live localhost proof |
|---|---|---|
| Warning truth | **PASS** | Synthetic browser-local metadata produced exactly `2 CJMs blocked` and `4 compatibility issues`; both affected journeys showed the expected `legacy-recording-contract` and `studio-version-drift` codes and matching details. |
| Copy diagnostic | **PASS** | Clipboard JSON preserved project identity, both real journey IDs, the deliberately long journey label, per-journey issue codes, and exact `affected=2`, `issues=4`, `blocking=0` totals. UI confirmed `Diagnostic copied`. |
| Run Tests handoff | **PASS** | `RUN TESTS` closed the dialog, opened QA, and invoked the canonical project-agnostic `all-cjms` suite (`play-all-cjms`, index 0/1). `window.__studioRunGlobalCompatibilityTests` was present. The proof run was then deliberately cancelled and QA cleared; no redundant marathon playback was performed. |
| Dismissal / focus | **PASS** | Escape, close button, and scrim each closed the lightbox and restored focus to the compatibility trigger. |
| Responsive / overflow | **PASS** | At 1440px the 580px dialog remained centered with no horizontal overflow. At the effective 500×640 minimum it inset to 12px, became 476px wide, contained the long label, and retained `scrollWidth === clientWidth`; the document also remained exactly 500px wide. |
| Zero-warning state | **PASS** | After restoring the real recording metadata and reloading, the compatibility trigger was absent while the separate manual-QA logger control remained present exactly once. |
| Project label SSoT | **PASS** | The empty-project state and project trigger both render `UXDS - Larkin`; the internal stable project id remains `puma`. |
| Routine visual hierarchy | **PASS** | Warning appears only for compatibility findings; manual QA remains a separate control. Dialog uses the existing nav/lightbox language and does not introduce a competing pattern. |

## Console and cleanup

- No application error was emitted by the compatibility dialog.
- Earlier Agent Testing warnings were expected evidence from deliberately stopping the QA handoff and disappeared after reload.
- Chrome still reports three pre-existing form fields without `id`/`name`; this is outside the compatibility-dialog surface and is logged as non-blocking product debt.
- The synthetic metadata fixture was restored from its session backup and removed; reload confirmed the real zero-warning state.

## Interaction matrix

| State / action | Pointer | Keyboard | Result |
|---|---:|---:|---|
| Open warning | PASS | PASS | Dialog opens with truthful summary. |
| Copy diagnostic | PASS | PASS | Exact machine-readable evidence copied. |
| Run Tests | PASS | PASS | Canonical all-CJM suite receives control. |
| Close button | PASS | PASS | Closes and restores trigger focus. |
| Escape | N/A | PASS | Closes and restores trigger focus. |
| Scrim | PASS | N/A | Closes and restores trigger focus. |
| Long label / narrow viewport | PASS | PASS | Wraps without clipping or horizontal overflow. |

## Knowledge used

- **Quinn (QA):** TEAM_KNOWLEDGE Quinn guidance on false-PROVEN prevention, fixed-localhost tab reuse, source-plus-live verification, exact diagnostic parity, panel XOR, responsive overflow, and QA handoff truth. Applied to fixture construction, clipboard comparison, interaction matrix, suite interception, cleanup, and final verdict.

