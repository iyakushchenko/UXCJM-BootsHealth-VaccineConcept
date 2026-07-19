# Quinn (QA) — PDP MCP prove criteria (prep)

**Status:** PREP only — **do not stamp PROVEN / HARD-GREEN** until MCP localhost matrix PASS after Finn mount.  
**Updated:** 2026-07-19 (Arch kickoff)  
**Screen:** `pdp` (Frame child 8)  
**Register:** [../features/PDP_MAKE_PARITY_REGISTER.md](../features/PDP_MAKE_PARITY_REGISTER.md)  
**Refs:** [RECORDING.md](../../../shell/RECORDING.md) · LESSONS overlay/scroll · PLP probe pattern in `studioMcpPageProbe.ts`

---

## Hard refuse rules

- **No false PROVEN** — Vitest/build green alone = BAD.
- Unchecked register **scaffold P0** = cannot PASS.
- Overlay missing / not visible on any step = FAIL.
- Click-through under open modal = felony FAIL.
- Invented PDP loader/spinner = FAIL (LE1–LE3 N/A).

---

## Probe entry

```js
await window.__studioRunMcpPageProbe?.({ screenId: "pdp", reload: false })
// aliases: __protoRunMcpPageProbe — same
// Open ?screen=pdp first (logged-out) so Book now → login.
```

**Recipe shipped** in `src/app/shell/studioMcpPageProbe.ts` (`pdpProbeSteps`). Still **no PROVEN** until Quinn MCP localhost matrix PASS after Finn L14–L20 + Uma fidelity.

---

## Matrix (scaffold ship)

| # | Step id | Action | Pass if | Notes |
|---|---------|--------|---------|-------|
| 0 | `overlay-arm` | assert BR panel | Agent testing overlay visible before clicks | mandatory |
| 1 | `pdp-host` | assert | `[data-studio-react-screen="pdp"]` present; Make leak=`data-studio-make-retired=pdp` on retired children | |
| 2 | `pdp-landmarks` | assert | `header` + `main` inside React host; BEM root `.pdp` | |
| 3 | `pdp-advantage` | assert | Advantage bar copy visible (Collect 3 points…) | |
| 4 | `pdp-no-loader` | assert | No listing/page spinner / “Updating…” invent | |
| 5 | `pdp-booster-price-on` | assert | Book now shows **£150** when booster checked (default) | |
| 6 | `pdp-booster-uncheck` | click checkbox | Book now → **£75**; unchecked mint hover CSS rule present | computed `:hover` via stylesheet (demo cursor ≠ CSS :hover) |
| 7 | `pdp-booster-recheck` | click | Book now → **£150** | |
| 8 | `pdp-heart-hover` | hover empty heart | Rest color not fuchsia; navy + mint wash hover CSS | |
| 9 | `pdp-book-logged-out` | click Book now | `&modal=login` | |
| 9b | `pdp-overlay-eyes-login` | refuse-click | under-modal click refused | mandatory overlay-eyes |
| 10 | `pdp-login-close` | close login | `modal` cleared; stay `screen=pdp` | |
| 11 | `pdp-check-avail` | click Check availability | `&modal=choose-pharmacy` | |
| 11b | `pdp-overlay-eyes-avail` | refuse-click | under-modal click refused | mandatory overlay-eyes |
| 12 | `pdp-avail-close` | close | modal cleared; stay `screen=pdp` | |
| 13 | `pdp-crumb-plp` | click Vaccination crumb | `screen=plp` (React PLP) | |
| 14 | `plp-to-pdp` | Book now from PLP | returns `screen=pdp` React host | |
| 15 | `pdp-below-fold-scroll` | `reveal` | Scroll-into-view + overlay visible | **SOFT-SKIP** until Finn L14–L20 stamps `data-studio-probe-below-fold` |
| — | `url-screen` | assert | ends on `screen=pdp` | auto after recipe |

Logged-in Book now → `screen=book-step-1` — prove in a second session or after login helper (document in evidence log).

**Below-fold / L14–L20:** `pdp-below-fold-scroll` PASSes with `soft-skip: L14–L20…` detail when the probe hook is absent. Do **not** treat soft-skip as fidelity PROVEN for Body7 bands.

---

## Evidence required for PROVEN later

1. Localhost tip SHA + version chip match `package.json`.
2. MCP panel step log (PASS/FAIL) or probe JSON with overlay-arm + overlay-eyes.
3. Register scaffold P0 rows marked Fixed/Present.
4. Uma fidelity kickoff notes cited; §0a DS matrix not skipped.
5. Arch team check with **Knowledge used** per role.

**Until then:** status = **NOT PROVEN**.
