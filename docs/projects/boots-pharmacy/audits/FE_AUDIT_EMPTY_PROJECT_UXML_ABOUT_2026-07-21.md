# FE / UI / UX audit — empty-project foundation + About UXML

**Date:** 2026-07-21  
**Auditor:** Quinn (QA), independent strict pass  
**Surfaces:** engine empty-project shell, Project selector, About UXML, Boots restoration  
**Verdict:** **PROVEN**

## Live evidence

- Canonical browser: Chrome DevTools MCP, existing `http://localhost:5173/` tab.
- Puma URL canonicalized to `?project=puma&screen=hub&persona=example-shopper&cjm=off&experience=traditional`.
- Puma DOM: `data-studio-project="puma"`, `data-studio-empty-project`, `data-project-label="Puma"`, zero `.studio-nav-tab`, zero page navigation/reset controls, no status-position node and no `0 / 0` copy.
- Foreign-project leak probe found none of Boots Pharmacy, Vaccinations, Sarah Jenkins, Book Step or Chickenpox; no `.studio-viewport` wire mounted for Puma.
- Empty surface computed background was `rgb(17, 21, 20)` and carried UXML logo, `Puma`, honest no-pages copy and next-step hint.
- Version evidence: nav `data-studio-version="0.0.104"` and title `UXML v0.0.104 (alpha)`; About displayed `Version v0.0.104 · alpha`. Root `package.json` is `0.0.104`; both consume `getStudioRelease()`.
- Project-label SSoT evidence: Puma empty-state heading/data attribute and collapsed selector both resolve from registered `ProjectDefinition.label`; Boots restores registered full menu label `Boots Pharmacy` and short trigger `Boots`.
- About content: UXML logo present; title `UXML`; `User Experience Modeling Lab`; internal R&D purpose and connected pages/CJM/REC/playback/QA copy; maintainer line; explicit alpha warning; exact Summarizer-source copyright `Made in UA with ♥ by Igor Yakushchenko ©` and LinkedIn target.
- About interactions: delayed hover opens; click opens; Escape closes and remains closed after 400ms; X closes; scrim pointerdown/click closes; every close restores focus to `[data-studio-action="open-uxml-about"]`.
- Responsive matrix: Puma at 1440×900 and 720×800; effective Chrome minimum 500×640 (a requested 360px window is clamped by Chrome to 500px). Document scroll width equalled viewport at every size. At 500, empty surface stayed 500px wide; About panel was x=30…470, 440px wide, fully visible, and required no internal vertical scroll.
- Boots regression: switching Puma → Boots via the same Project list restored URL `project=boots-pharmacy`, short label `Boots`, nine page tabs, Boots wire/onboarding and `0 / 9` Hub position. At 500px the document stayed 500px wide while the page-tab strip alone owned horizontal scrolling (`client=200`, `scroll=1585`).
- Chrome console: no warning or error messages on audited Puma/About/Boots paths.
- Automated evidence supplied by integration owner: 137/137 files and 796/796 tests green; production build green. This supports but does not replace the live proof above.

## Strict checklist

| Row | Result | Evidence |
|---|---|---|
| A1 | PASS | Empty state and About use the quiet dark UXML shell language; no Boots brand wash leaks into Puma. |
| A2 | PASS | Changed regions cover registry/content contract, zero-page nav, dark empty body, product identity and dialog copy. |
| A3 | PASS | Puma empty state remains engine dark; Boots branding returns only after selecting Boots. |
| B1 | N/A | No concept-page content column changed. |
| B2 | PASS | Empty-state logo, eyebrow, project heading and copy share a centered vertical axis. |
| B3 | PASS | Document width equals viewport at 1440, 720 and effective minimum 500; Boots tabs alone scroll. |
| B4 | PASS | Empty state and About remain legible and contained at all audited widths. |
| C1 | PASS | UXML/Project/version labels remain single-line; constrained width is absorbed by the flexible tabs region. |
| C2 | PASS | No icon/label stacking regression. |
| C3 | PASS | Fixed product prefix and version remain contained at all measured widths. |
| D1 | PASS | UXML delayed hover and Project dropdown hover/open behavior exercised live. |
| D2 | PASS | Dialog focuses Close, traps modal focus and restores the UXML trigger on Escape/X/scrim. |
| D3 | PASS | Dialog/listbox expose expanded/open and selected semantics. |
| D4 | N/A | This slice did not add a disabled empty-state CTA. |
| D5 | N/A | No UXDS search/field control exists on the changed surface. |
| E1 | PASS | Project switch empty→populated works through the real selector; About supports every specified dismissal path. |
| E2 | PASS | Empty state is honest and contains no fake page action; About link has a real destination. |
| E3 | PASS | All visible controls exercised or intentionally static copy. |
| F1 | PASS | One dark shell language and one muted emerald identity accent. |
| F2 | PASS | Project selector remains subordinate to page navigation/version. |
| F3 | PASS | Existing selector/dialog patterns reused; no control zoo. |
| G1 | PASS | Puma exposes no REC/play transport without pages; Boots transport returns with pages. |
| G2 | PASS | Puma has no `0 / 0`; Boots Hub correctly shows `0 / 9`. |
| G3 | PASS | About is modal and Project is a single listbox; no conflicting panel remained open. |
| G4 | PASS | Zero-page state suppresses REC/play chrome instead of showing unusable controls. |
| G5 | N/A | No AIR run required for the zero-page foundation; existing browse-lock gate was covered by prior UXML cluster audit. |
| G6 | N/A | No zero-page REC/CJM controls are rendered. |
| G7 | PASS | Puma mounts the React engine empty state only; Boots hybrid wire returns only for Boots. |
| G8 | N/A | No slot/chip grid changed. |
| G9 | PASS | Puma canonicalizes to Hub and cannot navigate to a fabricated page; Boots page targets return intact. |
| H1 | PASS | Boots project, Hub, nine tabs and wire restored after Puma. |
| H2 | PASS | No console warnings/errors across the audited path. |
| H3 | PASS | Verdict is based on source plus live interaction/measurement; automated green alone was not accepted. |
| I1 | PASS | One engine Project selector and one engine empty-state role. |
| I2 | PASS | Registered label drives selector/empty-state identity; registered short label drives Boots trigger. |
| I3 | PASS | Empty-state styling is engine shell CSS; no project-page CSS fork. |
| I4 | N/A | No UXDS kit deviation introduced. |
| J1–J4 | N/A | This is an engine shell foundation, not a Make→React page migration. |
| J5 | PASS | MCP matrix covers Puma identity/no-leak, no-page chrome, About content/interactions, SSoT, responsive widths and Boots restoration. |
| J6 | N/A | No page-probe helper was used; this was direct shell interaction proof. |

## Interaction and state matrix

| Case | Result |
|---|---|
| Puma registered project → honest zero-page state | PASS |
| Puma → no Boots content/wire leakage | PASS |
| Zero pages → no tabs, page counter, reset, previous/next, REC/play | PASS |
| UXML hover / click open | PASS |
| UXML Escape / X / scrim close + focus restore | PASS |
| About logo / copy / package version / alpha / exact-source copyright | PASS |
| Puma → Boots restores populated project | PASS |
| 1440 / 720 / effective minimum 500 containment | PASS |
| Console errors/warnings | PASS — none |

**Knowledge used:** Quinn applied the fixed-localhost/reuse-tab rule, source-plus-live evidence contract, false-PROVEN guard, responsive overflow measurement, panel-XOR/adjacent-project regression checks, and version-chip package SSoT rule from `TEAM_KNOWLEDGE.md`, `FE_UI_UX_AUDIT.md`, `VISUAL_FIDELITY.md`, and relevant lessons.
