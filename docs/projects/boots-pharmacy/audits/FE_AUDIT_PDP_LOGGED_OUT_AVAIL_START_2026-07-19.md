# Quinn (QA) — PDP logged-out Check availability → Find Pharmacy (patch prove)

**Surface:** PDP Vaccine Details — Availability Tool first screen (logged-out)  
**Date:** 2026-07-19  
**Auditor:** Quinn (QA) — Chrome DevTools MCP localhost  
**Ship tip:** `531a6ce` · **v0.0.25**  
**Scope:** Patch prove only — logged-out Check availability must open **Find Pharmacy** (`data-studio-avail-step="start"`), not Choose Date.  
**Not claimed:** Whole PDP Page Final Pass re-PROVEN (already HARD-GREEN; this does not re-stamp Final Pass).

**Auth SSoT:** `__studioIsLoggedIn()` / `__studioSetLoggedIn` via `studioAuthSession.ts`.

---

## Verdict

| Field | Value |
|-------|-------|
| **Patch claim** | **PASS** |
| **Tip** | `531a6ce` (≥ required `531a6ce` / v0.0.25) |
| **Version chip** | `v0.0.25` |
| **PDP Final Pass / PROVEN (full page)** | **Not re-stamped** — patch prove only |

**Team check line:** `Quinn MCP — pdp logged-out avail start — PASS` (tip `531a6ce`)

---

## MCP evidence

**Session:** Chrome DevTools MCP · `http://127.0.0.1:5186/?project=boots-pharmacy&screen=pdp`  
**Prep:** `__studioSetLoggedIn?.(false)` → `loggedIn === false` (cleared prior Sarah/login seed; modal closed)  
**Helper:** `await window.__studioRunMcpPageProbe?.({ screenId: "pdp", reload: false })`  
**Matrix result:** `{ pass: true, screenId: "pdp", checkCount: 19 }` · `failed: []`

### First-screen claim (critical)

| Check | Result | Evidence |
|-------|--------|----------|
| `pdp-check-avail` | **PASS** | Probe assert: logged-out → `data-studio-avail-step="start"` + title **Find Pharmacy** |
| Spot-check after Check availability click | **PASS** | `loggedIn: false`, `modal=choose-pharmacy`, `step: "start"`, `title: "Find Pharmacy"`, `firstScreenOk: true` |

### Related matrix spot-checks

| Step | Result | Detail |
|------|--------|--------|
| `pdp-check-avail` | **PASS** | `&modal=choose-pharmacy` + Find Pharmacy / `start` |
| `pdp-overlay-eyes-avail` | **PASS** | overlay eyes refused under-click |
| `pdp-avail-close` | **PASS** | modal cleared; stay `screen=pdp` |

Full matrix (19/19 PASS) also green on this tip; listed here as session context only — **gate for this audit is the first-screen claim**, not a Final Pass re-greenlight.

---

## Notes

1. Do **not** treat this as a new PAGE FINAL PASS HARD-GREEN stamp.  
2. Re-prove this patch if Availability Tool entry / logged-out step init changes after `531a6ce`.
