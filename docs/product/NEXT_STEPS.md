# UX Studio — next steps (living board)

**Updated:** 2026-07-19  
**Owner:** Tech Director (agents execute; PO accept/reject + assets only)  
**Forecast:** [PRODUCT_FORECAST.md](./PRODUCT_FORECAST.md) · [ARCHITECTURE.md](./ARCHITECTURE.md) · [HYGIENE.md](./HYGIENE.md)  
**Refs:** [COMMAND_DOCTRINE.md](./COMMAND_DOCTRINE.md) · [CI_ACTIONS_BUDGET.md](./CI_ACTIONS_BUDGET.md) · [NAMING.md](./NAMING.md) · [../shell/URL.md](../shell/URL.md)

---

## NOW

1. [x] **Recording v2 (demo-click vertical)** — selector-chain resolve → `simulateDemoPointerClick`; wire-intent for known `JourneyBeatActionId`; Boots book CTA `data-studio-action` markers ([RECORDING.md](../shell/RECORDING.md)).
2. [ ] **Versioning habit** — append notes on every user-visible ship (`npm run notes:append`). Release/tag CI stays **later**.

---

## NEXT

3. [ ] **Recording v2 gaps** — human REC click capture; `retreat-sync` / director-script / tab·home·book·avail **script** replay; only then compile→journeys.
4. [ ] **LEGACY retirement (by screen)** — no LEGACY growth; shrink Make wire + `globals-screens` as React pages land. Concept `.proto-*` classes retire with their screen.
5. [ ] **Engine monster splits** — on next touch of `App.tsx` / `useJourneyPlayback.ts`, extract by domain (recording bridge / beat advance) — not micro-files.
6. [ ] **Grow UXDS by page** — extract only on second use ([COMPONENT_LIBRARY.md](./COMPONENT_LIBRARY.md)).
7. [ ] **Residual fidelity (low)** — Book Steps 1–3 Make-only hexes with no bridge token yet. Do **not** invent aliases.

---

## LATER

10. [ ] **Second project rabbit** — after Boots book + URL + REC proven on Pages.
11. [ ] **Release / tag CI** — when versioning habit is stable and Actions budget allows.
12. [ ] **Broader CSS check ratchets** — more `scripts/check-*.mjs`, not more Playwright on every push.
13. [ ] **On-demand lean smoke** — keep `workflow_dispatch` / local `npm run smoke`; do **not** return auto smoke to default CI without a Director rewrite of this board.

---

## Done recently (context)

- [x] **Recording v2 demo-click replay** — `resolvePlaybackSelectorChain` + `applyDemoClick` / partial `applyWireIntent`; book CTA `data-studio-action`.
- [x] **Domain CSS/attrs phase 2** — `.proto-nav-*` / shell chrome → `.studio-*`; `data-proto-*` → `data-studio-*`; events/storage migrate with legacy read ([NAMING.md](./NAMING.md)).
- [x] **Hygiene gate** — Summarizer-lean LOC ratchet; LEGACY allowlisted.
- [x] **Retire `proto*` filenames** — modules → `studio*` / domain; `__studio*` + `__proto*` aliases.
- [x] **Naming + hard guardrails** — screen folders = `screenId`; director + `naming.mdc` / `ci-sitrep.mdc`.
- [x] **Recording replay from `screen` events** — `applyStudioScreen` shared with deep-link/popstate.
- [x] **Studio URL + agent overlay** — `?project=&screen=`; strip `proof`; overlay touch + sitrep.
- [x] **Fidelity debt (high-ROI)** + UXDS book kits — PROVEN audits under `docs/projects/boots-pharmacy/audits/`.
- [x] **REC ⊗ CJM** + slim CI + Book Steps 1–3 React pilots — PROVEN.

---

## Hard locks (do not regress)

| Lock | Rule |
|------|------|
| **REC ⊗ CJM ⊗ AIR** | REC off when journey mode on; XOR; AIR locks both |
| **No LEGACY growth** | New React page styles → screen CSS / UXDS / theme only |
| **No new `.proto-*` / `data-proto-*`** | PANEL/chrome/attrs use `.studio-*` / `data-studio-*` |
| **Nazi QA** | UI ship needs audit **PROVEN** before PO green-light |
| **CI budget** | No auto marathon Playwright on every push |
| **Post-push sitrep** | `gh run list` after push |
| **Hygiene** | `check:hygiene` must stay green |
| **Naming** | [NAMING.md](./NAMING.md); folder = `screenId` |
| **Lessons** | Append [LESSONS_LEARNED.md](./LESSONS_LEARNED.md) |
| **Clean URL** | No sticky `?proof=*` |
| **Workspace** | `E:\UX\ux-studio` only |

---

## Related

- [PRODUCT_FORECAST.md](./PRODUCT_FORECAST.md)
- [ARCHITECTURE.md](./ARCHITECTURE.md)
- [HYGIENE.md](./HYGIENE.md)
- [LESSONS_LEARNED.md](./LESSONS_LEARNED.md)
- [POST_CHANGE_CHECKLIST.md](./POST_CHANGE_CHECKLIST.md)
- [PRODUCT_OWNER_BRIEF.md](./PRODUCT_OWNER_BRIEF.md)
