# FE / UI / UX audit — Quick View modal URL (v0.0.19 / v0.0.20)

**Surface / slice:** PLP Quick View → `&modal=quick-view` open/close + overlay eyes  
**Date:** 2026-07-19  
**Auditor:** Quinn (QA) — Chrome DevTools MCP localhost:5185  
**Ship tip:** `c497589` (Knowledge stamp) · close-fix `1624f79` / **v0.0.19** · overlay probe harden `de2edf0` / **v0.0.20**  
**Policy:** [URL.md](../../../shell/URL.md) · [RECORDING.md](../../../shell/RECORDING.md) · TEAM modal URL registry HARD FAIL  
**Prior:** FAIL on tip `43c1ec8` / stamp `0f337f2` (close race re-opened via URL bridge)

**Knowledge used:** TEAM_KNOWLEDGE Quinn + URL.md modal table + LESSONS overlay eyes + RECORDING MCP page probe

---

## Verdict

| Field | Value |
|-------|-------|
| **Overall** | **PASS** / **PROVEN** |
| **PO green-light allowed?** | **Yes** — open writes `&modal=quick-view`; close clears URL + dismisses dialog; stays closed |
| **Quinn interaction matrix** | **PASS** — full PLP probe incl. QV open / overlay-eyes / close |

---

## MCP evidence

**Session:** `http://localhost:5185/?project=boots-pharmacy&screen=plp&persona=sarah-jenkins&mode=agentic-cjm`  
**Helper:** `await window.__studioRunMcpPageProbe({ screenId: "plp", reload: false })`  
**Result:** `{ pass: true, screenId: "plp" }` · chip `v0.0.20`

### Full matrix

| Step | Result | Detail |
|------|--------|--------|
| overlay-arm | **PASS** | BR panel visible |
| plp-host | **PASS** | |
| plp-book-now | **PASS** | |
| plp-search-icons | **PASS** | |
| plp-filter-view-all | **PASS** | |
| plp-filter-option-counters | **PASS** | |
| plp-checkbox-filter | **PASS** | |
| plp-reset-visible | **PASS** | |
| plp-reset-filters | **PASS** | |
| plp-reset-count-ready | **PASS** | |
| plp-quick-view-ready | **PASS** | |
| plp-below-fold-scroll | **PASS** | scroll-into-view + overlay visible |
| plp-quick-view | **PASS** | open writes `&modal=quick-view`; stay `screen=plp` |
| plp-overlay-eyes | **PASS** | overlay eyes refused under-click |
| plp-quick-view-close | **PASS** | dialog gone; `modal` cleared; stay `screen=plp` |
| url-screen | **PASS** | stay on `screen=plp` |

### Focus claims

| Claim | Result | Evidence |
|-------|--------|----------|
| Open → `&modal=quick-view` | **PASS** | `plp-quick-view` + URL after open |
| Jab id in URL | **N/A** | URL.md: optional `&jab=` later (multi-SKU) |
| Overlay eyes refuse under-tile | **PASS** | `plp-overlay-eyes` |
| Close clears modal + dismisses overlay | **PASS** | `plp-quick-view-close` + native timeline |
| Close **stays** closed (no URL re-open) | **PASS** | samples below — `modal` stays `null` |
| Stay on `screen=plp` | **PASS** | |

### Close stay-closed (native click timeline)

After Close button `click()`, samples (ms) on tip with `1624f79` suppress:

| t | `modal` | dialog present |
|---|--------|----------------|
| 80 | `null` | true (exit settle) |
| 160 | `null` | true |
| 250 | `null` | true |
| 400+ | `null` | false |

URL clears and **does not** return to `quick-view`. Dialog dismisses by ~400ms. Race from FAIL stamp (`160+ → modal=quick-view`) is gone.

**Fix (Finn):** `studioModalUrlBridgePlan` / `useStudioModalUrlBridge` suppress URL→open while intentional close waits for `&modal=` clear (`1624f79`, v0.0.19).

---

## Blockers

None.

---

## Follow-ups

| Item | Owner | Notes |
|------|-------|-------|
| Close race | **Finn (FE)** | **DONE** — `1624f79` |
| Re-prove + stamp PROVEN | **Quinn (QA)** | **DONE** — this stamp |
