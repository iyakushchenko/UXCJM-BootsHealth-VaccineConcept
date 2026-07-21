# FE / UI / UX audit — UXML identity + Project cluster

**Date:** 2026-07-21  
**Auditor:** Quinn (QA), independent of implementation  
**Surface:** Studio top navigation product cluster and UXML onboarding dialog  
**Verdict:** **PROVEN**

## Scope and evidence

- Source gates: `StudioNavPanel.tsx`, `StudioNavProductAbout.tsx`, `StudioNavStudioSelect.tsx`, `StudioNavVersionChip.tsx`, `studioNavProductCluster.css`, `studioNavPolish.css`.
- Live proof: Chrome DevTools MCP on canonical `http://localhost:5173/`, Boots PLP, at 1440×900 and 720×800.
- Live order at 1440: UXML (`x=7.9`) → Project (`x=58.5`) → delimiter → Hub (`x=123.9`) → scrollable page tabs → version chip (`right=1440`). Exactly one UXML trigger and one Project trigger were present.
- Responsive proof at 720: document width remained 720 with zero horizontal page overflow; fixed prefix ended at `x=157.1`, tabs owned the remaining scrollable region, and version chip remained contained at `right=720`. Project listbox was `x=58.3…279.9`, within the viewport.
- Dialog interaction proof: delayed hover opens; click opens; X closes; Escape closes and remains closed after 400ms; scrim pointerdown/click closes; focus returns to `About UXML`; dialog focus enters the Close button.
- Lock proof: with CJM ON, UXML, Project and Hub controls were all natively disabled and `.studio-nav-panel-host--playback-locked` was present.
- Identity proof: version DOM reported `data-studio-version="0.0.104"`, title `UXML v0.0.104 (alpha)`.
- Console proof: no warning or error messages on the audited path.

## Strict checklist

| Row | Result | Evidence |
|---|---|---|
| A1 | PASS | Muted emerald UXML chip and compact dark onboarding lightbox match the quiet Studio panel language; no page-brand wash. |
| A2 | PASS | Changed region is limited to identity, Project placement, separator, dialog and responsive containment. |
| A3 | PASS | Shell chrome owns its panel colors; Boots page theme was not altered by the product cluster. |
| B1 | N/A | Concept-page content column was not changed. |
| B2 | PASS | UXML, Project, divider, Hub and tabs share one aligned top row. |
| B3 | PASS | No document overflow at 1440 or 720; page tabs alone scroll horizontally. |
| B4 | PASS | 720px layout retains identity, Project, tabs and version without clipping or body overflow. |
| C1 | PASS | UXML and Project labels remain single-line; Project label ellipsizes within the fixed prefix. |
| C2 | PASS | No icon/label stacking introduced. |
| C3 | PASS | Fixed prefix and version remain stable; the page-tab strip absorbs constrained width. |
| D1 | PASS | UXML hover opens after the intended delay; Project trigger and options retain existing nav hover language. |
| D2 | PASS | Keyboard focus is visible; modal traps focus and restores it to UXML on close. |
| D3 | PASS | UXML open state and Project expanded/selected state are exposed semantically. |
| D4 | PASS | Playback/CJM lock natively disables UXML, Project and Hub. |
| D5 | N/A | No UXDS page field/search control changed. |
| E1 | PASS | Project list opens and Escape closes/restores trigger; selecting remains wired through the existing project selector. |
| E2 | PASS | UXML opens a real onboarding dialog; Project opens a real listbox; no ornamental fake controls. |
| E3 | PASS | Hover/click/Escape/X/scrim paths all exercised live. |
| F1 | PASS | Product cluster uses the existing dark nav hierarchy with one muted emerald identity accent. |
| F2 | PASS | Project selector is quieter than page navigation and version/QA controls. |
| F3 | PASS | No new chip/dropdown family was introduced for the Project selector. |
| G1 | PASS | CJM lock proof shows browse chrome remains locked; no REC/play mode leak observed. |
| G2 | PASS | Counter remained `3 / 9`; no duplicate step/page counter introduced. |
| G3 | PASS | UXML dialog is modal; Project listbox closes on Escape and no conflicting project/dialog panel remained open. |
| G4 | N/A | REC/play labels were not changed. |
| G5 | PASS | UXML, Project and Hub are disabled under the same browse-lock gate used during CJM/AIR. |
| G6 | N/A | REC⊗CJM implementation was not changed by this slice. |
| G7 | PASS | Product controls use stable `data-studio-action` hooks and React/Radix semantics. |
| G8 | N/A | No slot/chip grids changed. |
| G9 | PASS | Hub remains after the separator and is disabled under browse lock; page targets retain their existing indices. |
| H1 | PASS | PLP content and adjacent Studio controls remained intact at both viewports. |
| H2 | PASS | Chrome DevTools console reported no warnings or errors. |
| H3 | PASS | Verdict is based on live interaction and measured layout evidence, not unit/build status alone. |
| I1 | PASS | Existing `StudioNavStudioSelect` remains the single Project selector pattern. |
| I2 | PASS | Exactly one Project trigger and one UXML trigger were found live. |
| I3 | PASS | New CSS is confined to PANEL-layer nav files. |
| I4 | N/A | No UXDS kit deviation is introduced; this is engine-panel chrome. |
| J1–J4 | N/A | No Make→React concept-screen migration occurred. |
| J5 | PASS | Chrome DevTools MCP matrix covers order, hover, click, Escape, X, scrim, focus, lock, responsive containment, identity and console. |
| J6 | N/A | This was a shell-chrome audit, not an AGENT TESTING page-probe run. |

## Interaction matrix

| Path | Result |
|---|---|
| UXML hover → opens after delay | PASS |
| UXML click → opens | PASS |
| Escape → closes, focus restored, no hover reopen | PASS |
| X → closes, focus restored | PASS |
| Scrim → closes, focus restored | PASS |
| Project click → listbox opens | PASS |
| Project Escape → closes, trigger focused | PASS |
| CJM/AIR browse lock → UXML + Project + Hub disabled | PASS |
| 1440 layout/order/version | PASS |
| 720 overflow/dropdown containment | PASS |

**Knowledge used:** Quinn (QA) applied the fixed-localhost/reuse-tab rule, source-plus-live evidence rule, false-PROVEN guard, responsive overflow checks, and playback-lock interaction matrix from `TEAM_KNOWLEDGE.md`, `LESSONS_LEARNED.md`, and `FE_UI_UX_AUDIT.md`.
