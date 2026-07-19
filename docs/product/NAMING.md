# Naming conventions — UX Studio

**Status:** Locked (Tech Director, 2026-07-19)  
**Scope:** New files + applied engine rename (retire `proto*` filenames). **No big-bang rename** of historical Make dumps or every doctrine doc.  
**Audience:** Every agent creating or renaming files.

---

## Hard forbid: `proto*` as product identity

This product is **UX Studio**, not a prototype nickname.

| Rule | Detail |
|------|--------|
| **No new `proto*` / `Proto*` filenames** | Engine + project modules use domain names (`recording`, `nav`, `studio`, `scenario`, `journey`) or short role names (`Footer.tsx`, `screens.ts`). |
| Prefer | `studioUrl.ts`, `StudioNavPanel.tsx`, `recordingSession.ts`, `useStudio.ts` |
| Avoid | `protoStudioUrl.ts`, `ProtoNavPanel.tsx`, `protoRecordingSession.ts`, `useProtoStudio.ts` |
| **Window APIs** | Prefer `window.__studio*`. Legacy `window.__proto*` stay as **stable aliases** (mirrored in `src/app/shell/helperOverlayArm.ts`). Do not remove `__proto*` without a dedicated migration. |
| **CSS / DOM (phase 2)** | Panel/Make classes `.proto-*` / `.proto-studio-*` and `data-proto-*` remain until a full codemod + visual smoke. Do **not** half-rename classes. |
| **Journey beat field** | `protoTab` on beat JSON may remain until a beat-schema migration. |

### Migration map (applied 2026-07-19)

| Old pattern | New pattern | Notes |
|-------------|-------------|--------|
| `src/app/proto/*` | `src/app/scenario/*` | Scenario engine, demo cursor, playback scroll |
| `ProtoNav*` | `StudioNav*` | Studio chrome nav |
| `ProtoStudioJourneySwitch` / `ProtoStudioPlaybackRecSwitch` | `StudioJourneySwitch` / `StudioPlaybackRecSwitch` | Drop stacked Proto |
| `protoStudioUrl.ts` / `useProtoStudio*` | `studioUrl.ts` / `useStudio*` | Shell URL + state |
| `protoRecording*` | `recording*` | Recording domain |
| `protoJourney*` | `journey*` | Journey file/MCP/store |
| `protoPlayback*` (shell) | `playback*` | Playback guards/anomalies |
| `ProtoHub*` / `protoHub*` | `Hub*` / `hub*` | Hub wiki |
| `ProtoFooter*` / `protoFooter*` / `protoHeader*` | `Footer*` / `footer*` / `header*` | Chrome mounts |
| `protoScreens.ts` | `screens.ts` | `PROJECT_SCREENS`, `INDEX_BOOK_STEP*` |
| `scripts/proto-*-smoke.mjs` | `scripts/*-smoke.mjs` | `npm run smoke` → `playwright-smoke.mjs` |
| `protoDevErrorEntry.ts` | `studioDevErrorEntry.ts` | Vite HTML entry |

**Stayed as `proto` (intentional):**

- `window.__proto*` — legacy stable PO/MCP API (+ `__studio*` mirrors)
- `.proto-*` CSS classes / `data-proto-*` attributes — phase 2
- Event/storage string values such as `"proto-retreat-sync"`, `boots-vaccine-proto-*` session keys
- Beat field `protoTab`

---

## Rule of thumb

| Kind | Convention | Example |
|------|------------|---------|
| React components / pages | `PascalCase.tsx` | `BookStep1LocationScreen.tsx`, `StudioNavPanel.tsx` |
| Hooks | `use` + `PascalCase` → file `useCamelCase.ts` | `useScrollFill.ts`, `useStudio.ts` |
| Modules / utils / contracts / mounts | **`camelCase.ts`** (not kebab) | `bookStep1Contract.ts`, `studioUrl.ts`, `mountBookStep1Screen.tsx` |
| Screen folders | **kebab = `screenId`** | `screens/book-step-1/` ↔ `?screen=book-step-1` |
| Colocated page / kit CSS | **`kebab-case.css`** | `book-step-1-location.css`, `button-primary.css` |
| CSS modules | Avoid unless a kit already uses them | Prefer plain colocated CSS + BEM |
| BEM block (page CSS) | Prefer **`screenId`** as block | `.book-step-1__title` |
| Product / engine doctrine docs | **`SCREAMING_SNAKE.md`** | `COMMAND_DOCTRINE.md`, `NAMING.md` |
| Project docs | Under `docs/projects/<id>/`; same SCREAMING for durable briefs | `docs/projects/boots-pharmacy/BOOTS_REACT_SCREEN_PILOT.md` |
| Shell / UXDS inventory docs | `SCREAMING_SNAKE.md` or short `Title.md` already in tree | `docs/shell/URL.md` |
| Cursor rules | **`kebab-case.mdc`** | `ux-studio-director.mdc` |
| Scripts | **`kebab-case.mjs`** (`.ps1` OK for Figma sync) | `playwright-smoke.mjs`, `check-text-link-contract.mjs` |
| Vitest | `*.test.ts` in sibling `__tests__/` (preferred for app/projects) | `screens/book-step-1/__tests__/bookStep1Contract.test.ts` |
| Tiny pure unit next to source | Colocated `foo.test.ts` OK in `src/uxds/interactions/` | `accordionState.test.ts` |
| Project / persona ids | **kebab-case** | `boots-pharmacy`, `sarah-jenkins` |
| `screenId` / URL | **kebab-case** | `book-step-2`, `appointment-history` |

**Why camelCase modules (not kebab):** Matches the dominant `src/app/**` and `src/uxds/interactions/**` tree (~190 camel files). Vite + TS path imports stay readable next to `PascalCase` components. Kebab is reserved for **CSS files**, **folders that are URLs/ids**, and **scripts**.

**Why SCREAMING docs for product:** Existing doctrine catalog is already SCREAMING; renaming the corpus is high churn / low value. **New** engine docs stay SCREAMING. Legacy oddballs OK until touched.

**Journey beat ids vs `screenId`:** Address-bar / folder / `data-proto-react-screen` use `book-step-2`. Compact journey beat ids (`book-step2`, `book-step2-time`) may remain until a dedicated beat-id migration — URL parse aliases already normalize them ([../shell/URL.md](../shell/URL.md)). Do **not** “fix” beat ids as a drive-by rename.

---

## Screen package layout (React + UXDS)

```
src/projects/<project-id>/screens/<screenId>/
  <ScreenName>Screen.tsx          # PascalCase component
  mount<ScreenName>Screen.tsx     # camelCase createRoot host
  <screenIdContract or *Contract>.ts
  <screenId>-<role>.css           # kebab CSS; BEM block ≈ screenId
  __tests__/*.test.ts
```

**Hard rule:** folder name **equals** `PROJECT_SCREENS[].screenId` (and `data-proto-react-screen`).  
Do **not** invent `book-step1` when the URL is `book-step-1`.

---

## CSS layers ↔ file homes

| Layer | Home | Naming |
|-------|------|--------|
| BASE (UXDS) | `src/uxds/**/*.css` | kebab kit files (`text-link.css`) |
| THEME | `src/projects/<id>/styleguide/theme.css` | fixed name |
| PANEL | Studio chrome under `src/app/**` + panel CSS | component Pascal + `camel`/`kebab.css` as today (class strings may still say `.proto-studio-*` until phase 2) |
| LEGACY | Make globals only — **no new React page CSS here** | do not grow |
| Page | colocated under `screens/<screenId>/` | kebab CSS |

---

## Docs layout (ownership)

| Tree | What belongs |
|------|----------------|
| `docs/product/` | Engine doctrine, FE standards, CI, naming, templates |
| `docs/projects/<id>/` | Design deltas, screen pilots, FE audits |
| `docs/uxds/` | Larkin inventory + deviations |
| `docs/shell/` | URL, recording, playback, projects shell |

Old heavily linked paths may keep **thin stubs** (`> Moved. Canonical copy: …`). Do not dump project files into `docs/product/`.

**Forward-only:** new files follow this table. Legacy names OK until the file is substantially edited — then rename if it reduces stumble.

---

## Re-exports

Thin `src/app/*` shims that re-export from `src/projects/<id>/` may keep the **same basename** (compatibility). Prefer importing from the project path in new code.

---

## Applied vs forward-only (2026-07-19)

| Change | Status |
|--------|--------|
| Document pack (this file) + AGENTS / rules pointers | **Applied** |
| Boots screen folders `book-stepN` → `book-step-N` (+ CSS filenames / BEM) to match `screenId` | **Applied** (high-ROI) |
| Retire `proto*` / `Proto*` **filenames** (+ matching exports); `__studio*` window aliases | **Applied** |
| Mass-rename `.proto-*` CSS classes / `data-proto-*` | **Phase 2** — NEXT_STEPS |
| Mass-rename all `docs/product/*.md` to kebab | **Forward-only — do not** |
| Rename every camel module to kebab (or vice versa) | **Forward-only — do not** |
| Collapse duplicate `src/app` ↔ project basenames | **Later** (re-export cleanup), not this pass |

---

## Related

- [COMMAND_DOCTRINE.md](./COMMAND_DOCTRINE.md)  
- [PAGE_BUILD_CONTRACT.md](./PAGE_BUILD_CONTRACT.md)  
- [CSS_BASE_THEME.md](./CSS_BASE_THEME.md)  
- [../shell/URL.md](../shell/URL.md)  
- [../../AGENTS.md](../../AGENTS.md)  
- [../../.cursor/rules/naming.mdc](../../.cursor/rules/naming.mdc)  
