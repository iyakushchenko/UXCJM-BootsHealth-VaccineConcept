# Uma fidelity stamp — PDP

**Surface:** Boots Pharmacy PDP (`screenId: pdp`, Frame child **8**)  
**Date:** 2026-07-19  
**Owner:** Uma (UI/UX)  
**Status:** **PROVEN**  
**Tip at PROVEN:** _(filled at commit)_ · parent tip `c961e1b` · ship fix share flip · **v0.0.24**  
**React:** `src/projects/boots-pharmacy/screens/pdp/*` (L1–L20 RTB + below-fold)  
**Make truth:** `frame/index.tsx` `ModuleBreadcrumbs` / `Body6` / `Body7` / `ModulePdpRtb` / `ComponentPdpRtb` / `ComponentPdpAccordion` · `globals-screens` child-8 · `globals-chrome` checkbox/CTA/icon hits  
**Register:** [../features/PDP_MAKE_PARITY_REGISTER.md](../features/PDP_MAKE_PARITY_REGISTER.md)  
**Checklist:** [../../../product/UMA_FIDELITY_NOTES.md](../../../product/UMA_FIDELITY_NOTES.md) · [VISUAL_FIDELITY.md](../../../product/VISUAL_FIDELITY.md) · [FE_UI_UX_AUDIT.md](../../../product/FE_UI_UX_AUDIT.md) · [DS_STRICTNESS.md](../../../product/DS_STRICTNESS.md)

---

## Verdict

| Field | Value |
|-------|-------|
| **Overall** | **PROVEN** |
| **§0a typical DS / pointer matrix** | **PASS** — real MCP `:hover` computed (tip `87c0fc8` / v0.0.24) |
| **§0b RTB vertical rhythm** | **PASS** — measured `32px` stack; title-block `72px`; LEGACY `:not(.pdp__rtb-card)` |
| **P2 share glyph Make flip** | **PASS** — MCP computed `matrix(1, 0, 0, -1, 0, 0)` = Make `-rotate-180 -scale-x-100` |
| **PO green-light allowed?** | **Yes for Uma fidelity** — Arch may run **PAGE FINAL PASS** next (Quinn MCP already PASS) |
| **PAGE FINAL PASS** | **Unblocked for Arch** — needs `PAGE_FINAL_PASS.json` stamp + `check:page-final-pass` (not this Uma stamp) |

**Accepted residual (does not block PROVEN):** B1 FAQ accordion remains **static** (Make parity) until PO asks interactive — do not invent Accordion kit wire.

---

## RTB vertical rhythm checklist (§0b — mandatory before fidelity PROVEN)

**Make truth:** `ComponentPdpRtb` = `flex-col gap-[32px]`; stack = Frame128 (title+id) → Frame180 (price) → Frame182 (Myself/Someone else) → blurb → Units7 (booster) → Frame179 (CTAs).  
**PO hard-fail class:** cramped price→recipient→body→booster (Uma prior pass missed; claimed L6 PASS on CSS file alone).

| Gate | Make | React must prove | Status |
|------|------|------------------|--------|
| Parent column `gap` | `32px` | computed `.pdp__rtb-col` gap = `32px` (not LEGACY `48px !important`) | **PASS** — `32px` |
| title-block size | content (no 1:1) | `.pdp__title-block` height ≈ title+service (~72px); **not** media square | **PASS** — `72px` (aspect `auto`) |
| price → recipient | 32px sibling gap | rect distance ≈ 32 | **PASS** — `32` |
| recipient → body | 32px | rect distance ≈ 32 | **PASS** — `32` |
| body → booster | 32px | rect distance ≈ 32 | **PASS** — `32` |
| booster → CTA | 32px | rect distance ≈ 32 | **PASS** — `32` |
| Screenshot evidence | — | RTB column after fix | **PASS** — Chrome MCP viewport screenshot (v0.0.24) |
| LEGACY isolation | Make-only | `globals-screens` module rules `:not(.pdp__rtb-card)` | **PASS** — rule present; React gap stays 32 |

**Root cause (2026-07-19):** Make LEGACY  
`.studio-viewport … [data-name="module.pdp.rtb"] > div > div { gap: 48px !important }` and  
`… > :first-child { flex:1; aspect-ratio:1/1 }` matched React `module.pdp__rtb-card > .pdp__rtb-row > .pdp__rtb-col` / title-block — stole rhythm. Fixed via `:not(.pdp__rtb-card)` (`cbbd97d`).

---

## Browser evidence (Uma — localhost · v0.0.24)

**URL:** `http://127.0.0.1:5186/?project=boots-pharmacy&screen=pdp&persona=sarah-jenkins&mode=agentic-cjm`  
**Viewport:** 1440×900  
**Method:** Chrome DevTools MCP `evaluate_script` + `hover` + element screenshot (`aria-label="Share"`)  
**Version chip:** `v0.0.24`  
**Quinn functional matrix:** **PASS** — [FE_AUDIT_PDP_MCP_2026-07-19.md](./FE_AUDIT_PDP_MCP_2026-07-19.md) (stamp `87c0fc8`)

### §0b RTB measure (re-prove on tip)

| Probe | Result |
|-------|--------|
| React mount `.pdp[data-studio-react-screen=pdp]` | **Present** |
| Make retired `data-studio-make-retired=pdp` | **Present** |
| `.pdp__rtb-col` computed `gap` | **`32px`** |
| Sibling rect gaps (title→price→recipient→blurb→booster→CTA) | **`[32,32,32,32,32]`** |
| `.pdp__title-block` height / aspect / flex-grow | **`72` / `auto` / `0`** |
| LEGACY `:not(.pdp__rtb-card)` in CSSOM | **Present** (48px / 1:1 scoped away from React) |

### §0a pointer matrix (real MCP `:hover` → computed)

| Control | Rest → hover computed | Pass |
|---------|----------------------|------|
| Booster checkbox **unchecked** | box `background`+`border` → `rgb(198, 229, 225)` (`#c6e5e1`); `row.matches(':hover')` | **PASS** |
| Book now commerce | bg → `rgb(1, 49, 143)` (`#01318f`) + lift shadow | **PASS** |
| Check availability secondary | bg mint `rgb(198, 229, 225)`; icon fill/color `#01318f` | **PASS** |
| Empty wishlist heart | color/fill `#01318f` (**not** fuchsia); `::before` wash `#eef8f7` | **PASS** |
| Share icon | color `#01318f`; `::before` wash `#eef8f7` | **PASS** |
| Recipient inactive toggle | rule `.pdp__toggle-tab:not([data-toggle-active="true"]):hover` → `var(--uxds-filter-chip-surface-hover)` = `#eef8f7` (token resolve on `.pdp`) | **PASS** (rule+token; studio chrome can occlude live re-hover) |

**N/A on PDP:** SearchField / listing loader (LE1–LE3) — no invent.

**LE4:** Book now price instant swap — £150 default / £75 unchecked (Quinn + Uma click prove).

### P2 share glyph Make flip (MCP — PROVEN close)

**Make truth:** `frame/index.tsx` `icon=share` wrapper classes `-rotate-180 -scale-x-100`.  
**React fix:** `.pdp__share-icon { transform: rotate(-180deg) scaleX(-1); }` in `pdp.css`.

| Probe | Result |
|-------|--------|
| CSSOM rule `.pdp__share-icon` | `transform: rotate(-180deg) scaleX(-1)` |
| Computed `transform` on `.pdp__share-icon` | **`matrix(1, 0, 0, -1, 0, 0)`** |
| Match Make composition | **PASS** (rotate −180° × scaleX −1) |
| Hit target | `[aria-label="Share"]` 40×32; glyph 16×16 |
| Element screenshot | MCP `take_screenshot` on Share button — flipped glyph visible |

---

## Mandatory sign-off stamps

| Line | Stamp |
|------|-------|
| `loading states` | **N/A** — Make has no page loader / empty list / updating overlay (LE1–LE3). No skeleton/spinner invent observed on mount. |
| `checkbox/radio hover` | **PASS** — real MCP `:hover` mint on unchecked booster box |
| `typical DS checks` | **PASS** — §0a pointer matrix above (Book / secondary / heart / share / toggle kit) |
| `fidelity checklist` | **PROVEN** — L1–L20 + §0a/§0b PASS + P2 share flip PASS; B1 static accordion **accepted** |

---

## Layout bands L1–L20 — fidelity after pass

| # | Band | Uma stamp | Notes |
|---|------|-----------|-------|
| **L1** | 1440 / 64 / 1312 | **PASS** (layout) | Shell max 1440 + 64 pad; landmarks present |
| **L2** | Page bg atmosphere | **PASS** | White + decorative PNG under RTB |
| **L3** | Breadcrumbs | **PASS** | Diagonal delimiter; crumb grey `#7a7d87` |
| **L4** | RTB card stack | **PASS** | Drop shadow + top radius 16 |
| **L5** | Hero gallery 50/50 | **PASS** | Gap 48; 1:1; cover / center top |
| **L6** | RTB column | **PASS (measured)** | Gap **32px** after LEGACY isolation |
| **L7** | Title + service ID | **PASS (measured)** | Content-sized title-block **72px** |
| **L8** | List price | **PASS** | £75.00 static 25 semibold |
| **L9** | Recipient toggle + login | **PASS** | Active mint / inactive hover token `#eef8f7` |
| **L10** | Service blurb | **PASS** | 13 / leading 24 |
| **L11** | Booster checkbox | **PASS** | Unchecked hover mint proven |
| **L12** | CTA row | **PASS** | Book / secondary / heart / share hovers + **share Make flip** proven |
| **L13** | Advantage bar | **PASS** | Mint bar under card |
| **L14** | Below-fold body | **PASS** (layout) | `py 96` / `gap 72` |
| **L15** | Content hero | **PASS** | 39 bold + 14×3 `#afccca` |
| **L16** | Intro copy | **PASS** | 864 / two paras |
| **L17** | Appointment strip | **PASS** | `#e5f1f8` pill + icon |
| **L18** | Specs table | **PASS** | 864 card / `#dadada` / rows + downloads static |
| **L19** | FAQ accordion | **PASS** (static B1 **accepted**) | Six headers; open body static; no Accordion kit until PO |
| **L20** | GP promo | **PASS** (layout) | Mint 24 radius + Find out more static |

---

## Remaining residuals

| Residual | Severity | Owner |
|----------|----------|-------|
| Accordion interactive expand | **Accepted B1** — static until PO | Pax / Bea |
| PAGE FINAL PASS / `check:page-final-pass` | P0 sequencing — Arch next (Uma PROVEN + Quinn MCP PASS clear the Uma blocker) | Quinn + Arch |
| Register React column catch-up notes | Doc | Bea |

---

## FAIL classes — this pass

| Class | Status |
|-------|--------|
| Invent loader | **Clear** |
| Advantage miss | **Clear** |
| Empty-heart fuchsia | **Clear** (live hover → navy) |
| Dead checkbox | **Clear** (live hover → mint) |
| Primary mint wash | **Clear** (commerce navy hover) |
| Flat secondary | **Clear** |
| Toggle hover skip | **Clear** (token + rule) |
| Booster row tint | **Clear** |
| 50/50 drift | **Clear** |
| Price confusion | **Clear** |
| Invent accordion | **Clear** (static accepted) |
| Make visual leak | **Clear** |
| RTB vertical rhythm / LEGACY steal | **Clear** — measured 32px / title 72px |
| Share glyph missing Make flip | **Clear** — MCP matrix match |
| Rest-state PROVEN | **PROVEN** |

---

## team check report lines (Uma)

```
Uma (UI/UX): fidelity checklist — PROVEN (§0a PASS; §0b PASS; P2 share flip PASS; B1 static accepted)
Uma (UI/UX): section vertical rhythm (§0b) — PASS (32px stack; title-block 72px; tip 87c0fc8 / cbbd97d)
Uma (UI/UX): loading states — N/A (no Make loader; invent = FAIL) — PASS for absence
Uma (UI/UX): checkbox/radio hover — PASS (MCP :hover mint on unchecked booster)
Uma (UI/UX): typical DS checks (state matrix) — PASS (§0a; tip 87c0fc8 / v0.0.24)
Uma (UI/UX): share glyph Make flip — PASS (MCP transform matrix(1,0,0,-1,0,0) = -rotate-180 -scale-x-100)
```

**Knowledge used:** UMA_FIDELITY_NOTES §0/§0a/**§0b** · VISUAL_FIDELITY · DS_STRICTNESS · PDP_MAKE_PARITY_REGISTER L6–L12 · Make `ComponentPdpRtb` gap-32 · Make `icon=share` `-rotate-180 -scale-x-100` · LEGACY `:not(.pdp__rtb-card)` · Quinn FE_AUDIT_PDP_MCP `87c0fc8` · PAGE_FINAL_PASS.md (Arch next).

---

## Related

- [PDP_REACT.md](../features/PDP_REACT.md) · [PDP_MAKE_PARITY_REGISTER.md](../features/PDP_MAKE_PARITY_REGISTER.md)  
- [QUINN_PDP_PROBE_CRITERIA_2026-07-19.md](./QUINN_PDP_PROBE_CRITERIA_2026-07-19.md) · [FE_AUDIT_PDP_MCP_2026-07-19.md](./FE_AUDIT_PDP_MCP_2026-07-19.md)  
- PLP HARD-GREEN audit: [FE_AUDIT_PLP_PAGE_FINAL_PASS_2026-07-19.md](./FE_AUDIT_PLP_PAGE_FINAL_PASS_2026-07-19.md)
