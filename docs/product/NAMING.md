# Naming conventions — UX Studio

**Status:** Locked (Tech Director, 2026-07-19)  
**Scope:** New files and high-ROI fixes. **No big-bang rename** of historical docs or Make dumps.  
**Audience:** Every agent creating or renaming files.

---

## Rule of thumb

| Kind | Convention | Example |
|------|------------|---------|
| React components / pages | `PascalCase.tsx` | `BookStep1LocationScreen.tsx` |
| Hooks | `use` + `PascalCase` → file `useCamelCase.ts` | `useProtoScrollFill.ts` |
| Modules / utils / contracts / mounts | **`camelCase.ts`** (not kebab) | `bookStep1Contract.ts`, `mountBookStep1Screen.tsx` |
| Screen folders | **kebab = `screenId`** | `screens/book-step-1/` ↔ `?screen=book-step-1` |
| Colocated page / kit CSS | **`kebab-case.css`** | `book-step-1-location.css`, `button-primary.css` |
| CSS modules | Avoid unless a kit already uses them | Prefer plain colocated CSS + BEM |
| BEM block (page CSS) | Prefer **`screenId`** as block | `.book-step-1__title` |
| Product / engine doctrine docs | **`SCREAMING_SNAKE.md`** | `COMMAND_DOCTRINE.md`, `NAMING.md` |
| Project docs | Under `docs/projects/<id>/`; same SCREAMING for durable briefs | `docs/projects/boots-pharmacy/BOOTS_REACT_SCREEN_PILOT.md` |
| Shell / UXDS inventory docs | `SCREAMING_SNAKE.md` or short `Title.md` already in tree | `docs/shell/URL.md` |
| Cursor rules | **`kebab-case.mdc`** | `ux-studio-director.mdc` |
| Scripts | **`kebab-case.mjs`** (`.ps1` OK for Figma sync) | `check-text-link-contract.mjs` |
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

**Hard rule:** folder name **equals** `PROTO_SCREENS[].screenId` (and `data-proto-react-screen`).  
Do **not** invent `book-step1` when the URL is `book-step-1`.

---

## CSS layers ↔ file homes

| Layer | Home | Naming |
|-------|------|--------|
| BASE (UXDS) | `src/uxds/**/*.css` | kebab kit files (`text-link.css`) |
| THEME | `src/projects/<id>/styleguide/theme.css` | fixed name |
| PANEL | Studio chrome under `src/app/**` + panel CSS | component Pascal + `camel`/`kebab.css` as today |
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
