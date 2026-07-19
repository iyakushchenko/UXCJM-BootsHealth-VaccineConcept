# Quinn (QA) — PDP MCP prove

**Surface:** PDP Vaccine Details (`screenId: pdp`)  
**Date:** 2026-07-19  
**Auditor:** Quinn (QA) — Chrome DevTools MCP localhost  
**Ship tip (latest prove):** `bf59041` · **v0.0.28** — FAQ Make bodies + download CTA unify + accordion focus-none  
**Probe tip (CTA assert fix):** this stamp commit — ignore `proto-chat-cta--hover` on download class compare  
**Uma §0a:** **PROVEN** @ `8d80d5f` (code tip `bf59041`)  
**Prior prove (superseded):** `d6e4951` · **v0.0.27**  
**Policy:** [QUINN_PDP_PROBE_CRITERIA_2026-07-19.md](./QUINN_PDP_PROBE_CRITERIA_2026-07-19.md) · [RECORDING.md](../../../shell/RECORDING.md) · recipe `studioMcpPageProbe.ts`  
**Final Pass audit:** [FE_AUDIT_PDP_PAGE_FINAL_PASS_2026-07-19.md](./FE_AUDIT_PDP_PAGE_FINAL_PASS_2026-07-19.md) — Arch may restore HARD-GREEN

---

## Verdict

| Field | Value |
|-------|-------|
| **Quinn MCP matrix** | **PASS** — **23/23** |
| **v0.0.28 steps** | `pdp-faq-help-body` + download CTA tertiary unify / no `--bordered` + accordion focus-none CSS |
| **Uma fidelity §0a** | **PROVEN** — [UMA_FIDELITY_PDP_2026-07-19.md](./UMA_FIDELITY_PDP_2026-07-19.md) @ `8d80d5f` |
| **PAGE FINAL PASS HARD-GREEN?** | **Pending Arch** (`hardGreen: false` until Arch restore) |
| **PO green-light / Home?** | **Blocked** — wait Arch HARD-GREEN + PO `+` |

**Team check line:** `Quinn MCP — pdp — PASS` (23/23 @ v0.0.28 / `bf59041`; Arch unblocked for HARD-GREEN)

**Knowledge used:** QUINN_PDP_PROBE_CRITERIA · RECORDING.md (overlay + scroll-into-view + overlay-eyes + teardown) · PAGE_FINAL_PASS.md (Quinn matrix PASS; Arch HARD-GREEN) · TEAM_KNOWLEDGE Quinn § · demo-cursor `proto-chat-cta--hover` false-fail lesson

---

## MCP evidence (v0.0.28 re-prove · `bf59041` + probe CTA fix)

**Session:** Chrome DevTools MCP · `http://127.0.0.1:5188/?project=boots-pharmacy&screen=pdp`  
**Version chip:** `v0.0.28`  
**Helper:** `await window.__studioRunMcpPageProbe({ screenId: "pdp", reload: false })`  
**Result:** `{ pass: true, screenId: "pdp" }` · `failed: []` · **23/23** checks  
**Overlay:** AGENT TESTING armed (`overlay-arm`) and visible through matrix including below-fold reveal  
**Prep (mandatory for honest logged-out / empty-heart):** `__studioSetLoggedIn(false)`; wishlist `["probe-dummy"]` so chickenpox empty; Book now **£150** (booster default on) before probe  
**Teardown:** login + choose-pharmacy closes clear `modal`; end `screen=pdp`

### Landmarks / host (spot-check)

| Check | Result |
|-------|--------|
| `.pdp[data-studio-react-screen=pdp]` + `header`/`main` | **PASS** |
| `data-studio-make-retired=pdp` | **PASS** |
| FAQ “Who is at risk?” Accordion | **PASS** (toggle/reopen + Make body) |
| FAQ “How can Boots help?” body | **PASS** (Make RTB blurb + focus-none CSS) |
| Download CTAs both `.pdp__pill` (no `--bordered`) | **PASS** |

### Full matrix

| Step | Result | Detail |
|------|--------|--------|
| overlay-arm | **PASS** | BR panel visible |
| pdp-host | **PASS** | React host + make-retired |
| pdp-landmarks | **PASS** | `header` + `main` + BEM `.pdp` |
| pdp-advantage | **PASS** | Collect 3 points… |
| pdp-no-loader | **PASS** | no invented spinner / Updating… |
| pdp-booster-price-on | **PASS** | Book now **£150** |
| pdp-booster-uncheck | **PASS** | Book now **£75** + mint hover CSS |
| pdp-booster-recheck | **PASS** | Book now **£150** |
| pdp-heart-hover | **PASS** | empty heart not fuchsia; navy + mint wash CSS |
| pdp-book-logged-out | **PASS** | `&modal=login` |
| pdp-overlay-eyes-login | **PASS** | refuse under-click |
| pdp-login-close | **PASS** | modal cleared; stay `screen=pdp` (teardown clean) |
| pdp-check-avail | **PASS** | `&modal=choose-pharmacy` + Find Pharmacy / `start` (logged-out) |
| pdp-overlay-eyes-avail | **PASS** | refuse under-click |
| pdp-avail-close | **PASS** | modal cleared; stay `screen=pdp` (teardown clean) |
| pdp-crumb-plp | **PASS** | Vaccination → `screen=plp` |
| plp-to-pdp | **PASS** | PLP Book now → React PDP |
| pdp-below-fold-scroll | **PASS** | already in view + overlay visible |
| pdp-faq-accordion-toggle | **PASS** | Who is at risk? → `aria-expanded=false`; body unmounted |
| pdp-faq-accordion-reopen | **PASS** | click again → `aria-expanded=true` + Make body copy |
| pdp-faq-help-body | **PASS** | How can Boots help? Make RTB blurb + accordion focus-none CSS |
| pdp-download-cta-hover | **PASS** | both tertiary `.pdp__pill`; no `--bordered` stub/CSS; hover rules present |
| url-screen | **PASS** | ends `screen=pdp` |

---

## Prior proves (kept for history)

| Tip | Version | Matrix | Note |
|-----|---------|--------|------|
| `d6e4951` | v0.0.27 | **PASS** 22/22 | stale after v0.0.28 polish |
| `d7ce01c` | v0.0.24 | **PASS** | Final Pass then demoted — **superseded** |
| `cbbd97d` / `87c0fc8` | v0.0.24 | **PASS** | RTB rhythm — superseded |
| `eaf9aa3` / `03687d3` | v0.0.22 | **PASS** | compact below-fold stamp |

---

## Final Pass gate status

| Gate | Status |
|------|--------|
| Quinn MCP interaction matrix | **PASS** (this re-prove · 23/23 · `bf59041` / v0.0.28) |
| Uma §0a (FAQ/CTA/focus) | **PROVEN** (`8d80d5f`) |
| `PAGE_FINAL_PASS.json` `mcpFinalPass` HARD-GREEN | **Pending Arch** |
| `hardGreen` | **false** until Arch restore |

---

## Prep notes for future Quinn runs

1. Open logged-out PDP; `__studioSetLoggedIn(false)` if header shows Sarah.  
2. Empty chickenpox heart before probe (`aria-label="Add to wishlist"`); avoid empty wishlist array (reseeds chickenpox).  
3. Confirm booster default checked + £150 **before** `__studioRunMcpPageProbe`.  
4. Re-prove after any tip that lands after the last MCP stamp.  
5. Download CTA assert compares **product** `pdp__*` classes only (demo hover adds `proto-chat-cta--hover`).  
6. Do not stamp `hardGreen: true` from Quinn — Arch after this PASS + Uma §0a.
