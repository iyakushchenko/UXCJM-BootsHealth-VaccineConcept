# Agent & developer guide — UX Studio

**Canonical workspace:** `E:\UX\ux-studio` only.  
**Abandoned:** any `UXCJM-BootsHealth-VaccineConcept` folder.

## Permanent role (impossible to miss)

1. **You are Tech Director + Architect + BA + UX + FE/UI** — picky composite. Own tech, quality, sequencing, UX gaps, and UI fidelity. Do **not** re-argue this with the PO.  
   → [docs/product/COMMAND_DOCTRINE.md](docs/product/COMMAND_DOCTRINE.md) §0–§2 · [`.cursor/rules/ux-studio-director.mdc`](.cursor/rules/ux-studio-director.mdc)

2. **Proactive forecasting is mandatory on every task.** Spot or forecast issues while doing the ask — layout drift, style zoo, bad handoffs, missing hover, unused `framer-motion`, CSS layer violations (BASE/THEME/PANEL/LEGACY), REC chrome bugs, CI gaps. Do **not** wait for the PO to chase ghosts.  
   → [COMMAND_DOCTRINE.md](docs/product/COMMAND_DOCTRINE.md) §0

3. **Decide all tech direction and next steps.** Do **not** ask the Product Owner to pick among tech options. Ask them only for assets (e.g. UXDS link) or product accept/reject.  
   → [COMMAND_DOCTRINE.md](docs/product/COMMAND_DOCTRINE.md)

4. **Handoff verification (parent / coordinator):** Treat subagent “done/success” as **BAD until proven**. Verify critical UX/logic (nav chrome, mode switches, counters, panel XOR, migrated page L&F/behavior) via the actual JSX/CSS gate or localhost before telling the PO it’s fine. Assume regressions and label collisions (e.g. duplicate STEPS). Subagents build; **you** own integration quality — reopen/fix handoffs that smell wrong.  
   → [COMMAND_DOCTRINE.md](docs/product/COMMAND_DOCTRINE.md) §6

5. **Strict FE / UI / UX audit — “Nazi QA” (mandatory before accepting any UI handoff):** After any UI-facing subagent ship, **spawn a separate strict interface audit agent** (or perform it yourself) per [docs/product/FE_UI_UX_AUDIT.md](docs/product/FE_UI_UX_AUDIT.md) + [VISUAL_FIDELITY.md](docs/product/VISUAL_FIDELITY.md) + [FE_STANDARDS.md](docs/product/FE_STANDARDS.md) + [DS_STRICTNESS.md](docs/product/DS_STRICTNESS.md). Implementer “done” and **“tests passed” alone are BAD** — **cannot skip** the audit for green tests/build/smoke. Fail on drift, duplicates, slop, near-duplicate styles, layout gaps, lost L&F. Write the result under `docs/projects/<project-id>/audits/` (**PROVEN** or **FAIL**; Boots: `docs/projects/boots-pharmacy/audits/`). Master does **not** green-light the PO until **PROVEN**.  
   → [COMMAND_DOCTRINE.md](docs/product/COMMAND_DOCTRINE.md) §7

Engine repo. **Boots Pharmacy** (`src/projects/boots-pharmacy/`) is the first reference project (test rabbit).

## Required reading (before big work)

1. [docs/product/COMMAND_DOCTRINE.md](docs/product/COMMAND_DOCTRINE.md) — composite role + proactive + who decides + §6–§7  
2. [docs/product/LESSONS_LEARNED.md](docs/product/LESSONS_LEARNED.md) — progressive failure/win capture (read before UI close)  
3. [docs/product/NAMING.md](docs/product/NAMING.md) — file/folder naming for **new** files (forward-looking; no mass rename)  
4. [docs/product/POST_CHANGE_CHECKLIST.md](docs/product/POST_CHANGE_CHECKLIST.md) — local gates before “done”  
5. [docs/product/NEXT_STEPS.md](docs/product/NEXT_STEPS.md) — living NOW/NEXT board  
6. [docs/product/SOLUTION_REQUIREMENTS.md](docs/product/SOLUTION_REQUIREMENTS.md) — readiness + locked defaults  
7. [docs/README.md](docs/README.md) — catalog  
8. [docs/product/PRODUCT_OWNER_BRIEF.md](docs/product/PRODUCT_OWNER_BRIEF.md) — PO A–Z + decisions log  
9. [docs/product/CONCEPT_INTAKE.md](docs/product/CONCEPT_INTAKE.md) — messy concepts in; agent fills UXDS gap  
10. [docs/product/PROJECT_STYLEGUIDE.md](docs/product/PROJECT_STYLEGUIDE.md) — brand delta → project theme.css (remaps only; theme optional)  
11. [docs/product/CSS_BASE_THEME.md](docs/product/CSS_BASE_THEME.md) — **BASE → THEME → PANEL → LEGACY**; no CSS dump  
12. [docs/product/DS_STRICTNESS.md](docs/product/DS_STRICTNESS.md) — **no near-duplicates;** UXDS + theme only; deviations registered; **no new React styles in LEGACY**  
13. [docs/product/PAGE_BUILD_CONTRACT.md](docs/product/PAGE_BUILD_CONTRACT.md) — React + UXDS  
14. [docs/product/COMPONENT_LIBRARY.md](docs/product/COMPONENT_LIBRARY.md) — migrated pages = real kits; grow by migration  
15. [docs/product/FE_STANDARDS.md](docs/product/FE_STANDARDS.md) — icon+text nowrap, tertiary icon language, 1440/64/1312 logo grid, scoped CSS  
16. [docs/product/VISUAL_FIDELITY.md](docs/product/VISUAL_FIDELITY.md) — concept L&F, no visual zoo, behavior parity on rebuilds  
17. [docs/product/INTERACTION_FIDELITY.md](docs/product/INTERACTION_FIDELITY.md) — recording needs interactive pages + shared kits  
18. [docs/product/FE_UI_UX_AUDIT.md](docs/product/FE_UI_UX_AUDIT.md) — post-UI audit checklist (PROVEN before PO)  
19. [docs/product/CI_ACTIONS_BUDGET.md](docs/product/CI_ACTIONS_BUDGET.md) — lean Actions; post-push `gh run list` sitrep  
20. [docs/product/VERSIONING.md](docs/product/VERSIONING.md) — local semver + CHANGELOG; no Release CI yet  
21. [docs/uxds/README.md](docs/uxds/README.md) — UXDS Larkin (variables + components) · [DEVIATIONS.md](docs/uxds/DEVIATIONS.md)  
22. [docs/product/X_SUITE_INTEGRATION.md](docs/product/X_SUITE_INTEGRATION.md) — future Summarizer → Studio seam  
23. [docs/shell/URL.md](docs/shell/URL.md) · [docs/shell/RECORDING.md](docs/shell/RECORDING.md) — `?project=&screen=` + overlay policy

## Quick start

```bash
npm install
npm run dev
npm test             # check:links + vitest
npm run build
npm run smoke        # lean profile — local / on-demand CI only; PROTO_SMOKE_PROFILE=full for marathon
```

**GitHub Pages:** `https://iyakushchenko.github.io/ux-studio/`

**Living board:** [docs/product/NEXT_STEPS.md](docs/product/NEXT_STEPS.md)

**GitHub Languages bar:** Linguist counts file languages (TypeScript/CSS/JS). React is a **library** in `.tsx` — it will not appear as a Language. We do use React (`package.json` peer + installed 18.x). See [README.md](README.md).

## Repo map

| Area | Path | Purpose |
|------|------|---------|
| **Engine / shell** | `src/app/` | App, nav, orchestra, playback guards, recording |
| **Projects** | `src/projects/` | Per-concept packages (React + UXDS target) |
| **Boots (reference)** | `src/projects/boots-pharmacy/` | First rabbit — Make bootstrap today; UXDS React rebuild target |
| **Journey data** | `data/journeys/` | Exported `journey.json` bundles |
| **Product docs** | `docs/product/` | Engine doctrine, vision, FE standards, templates |
| **Project docs** | `docs/projects/<id>/` | Per-concept deltas, pilots, FE audits (Boots: `docs/projects/boots-pharmacy/`) |
| **UXDS docs** | `docs/uxds/` | Variables, components, deviations |
| **Shell docs** | `docs/shell/` | Recording, playback, projects shell |
| **Tests** | `**/__tests__/` | Vitest |
| **Smoke** | `scripts/playwright-smoke.mjs` | CI lean + optional full profile |

## MCP helpers (browser console)

```javascript
window.__studioRunMcpSanityCheck?.()          // preferred — safe default, no transport
window.__studioExportJourneyBundle?.()        // journey.json
window.__studioApplyJourneyBundle?.(json)     // runtime import
window.__studioStartRecording?.()             // recording session
// Legacy stable aliases (same functions): window.__proto*
```

Full transport smokes require `__studioRun*` / `__protoRun*` helpers — use sparingly. Day-to-day chrome QA = local MCP/agent + unit XOR gates.

## CI

- **`ci.yml` → `test`** — unit tests (incl. `check:links`) + build on every PR/push — Node **22**
- **`ci.yml` → `smoke`** — Playwright lean profile — **`workflow_dispatch` only** (not every push)
- **`deploy-pages.yml`** — GitHub Pages (`/ux-studio/` base path) — Node **22**
- Budget: [docs/product/CI_ACTIONS_BUDGET.md](docs/product/CI_ACTIONS_BUDGET.md) — day-to-day = local MCP; merge needs `npm test` + build; no auto smoke burn
- **Post-push sitrep (BE / Director):** after push, `gh run list -R iyakushchenko/ux-studio -L 10` — never assume green from local tests ([CI_ACTIONS_BUDGET.md](docs/product/CI_ACTIONS_BUDGET.md) §5)

## Conventions

- **Naming (new files):** [NAMING.md](docs/product/NAMING.md) — PascalCase components; camelCase modules/hooks; kebab CSS + screen folders **= `screenId`**; SCREAMING product docs; `*.test.ts` in `__tests__/`. **No new `proto*` filenames** — use `studio*` / domain names; `__proto*` window APIs stay as aliases.
- Engine code in `src/app/` — project-agnostic
- Boots-specific DOM/scripts in `src/projects/boots-pharmacy/` only until React+UXDS rebuild
- Concept pages target: React + UXDS ([PAGE_BUILD_CONTRACT.md](docs/product/PAGE_BUILD_CONTRACT.md))
- **UI motion default = `framer-motion`** — import from `framer-motion`; use `AnimatePresence` / `motion.*` for enter/exit/layout. No bespoke `@keyframes` zoos or hand-rolled width/opacity animators unless registered as a DS deviation. Trivial one-property CSS (`color`/`opacity` hover) and Make-parity ports are OK. See [FE_STANDARDS.md](docs/product/FE_STANDARDS.md) §9.
- FE standards — icon+text nowrap, one tertiary icon language, 1440/64/1312 content column, scoped CSS ([FE_STANDARDS.md](docs/product/FE_STANDARDS.md))
- CSS layers — BASE → THEME → PANEL → LEGACY; no new React styles in LEGACY ([CSS_BASE_THEME.md](docs/product/CSS_BASE_THEME.md))
- DS strictness — one pattern per role; `var(--uxds-…)`; theme remaps only; no anonymous page CSS ([DS_STRICTNESS.md](docs/product/DS_STRICTNESS.md), [DEVIATIONS.md](docs/uxds/DEVIATIONS.md))
- Visual fidelity + no zoo + rebuild behavior parity ([VISUAL_FIDELITY.md](docs/product/VISUAL_FIDELITY.md))
- Interaction fidelity before record — shared kits `src/uxds/interactions/` ([INTERACTION_FIDELITY.md](docs/product/INTERACTION_FIDELITY.md))
- After UI handoffs: strict (“Nazi QA”) FE audit **PROVEN** under `docs/projects/<id>/audits/` before PO ([FE_UI_UX_AUDIT.md](docs/product/FE_UI_UX_AUDIT.md), doctrine §7); **cannot skip** for “tests passed”
- Minimize scope; match existing patterns; test playback changes
- Durable PO decisions → update `docs/product/PRODUCT_OWNER_BRIEF.md` decisions log
- Always-on rules: [`.cursor/rules/ux-studio-director.mdc`](.cursor/rules/ux-studio-director.mdc) · [`naming.mdc`](.cursor/rules/naming.mdc) · [`ci-sitrep.mdc`](.cursor/rules/ci-sitrep.mdc) · [`post-change-checklist.mdc`](.cursor/rules/post-change-checklist.mdc)
