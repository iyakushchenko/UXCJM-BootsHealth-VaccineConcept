# Boots React screen pilot — Book Step 1 (Location)

**Status:** Shipped (commander, mode B — from what we have)  
**Date:** 2026-07-19  
**Screen:** Book — Step 1 — Location (`PROTO_SCREENS` tab 5, Frame child index **7**)

---

## Why this screen

| Criterion | Rationale |
|-----------|-----------|
| CJM path | On Sarah **Traditional CJM** (`choose-location` / `book-location-pick`) |
| Proof value | First full-page React + UXDS replacement in the booking funnel |
| Feasible scope | Search, near-me chip, chosen store, CTAs, booster, progress — no calendar |
| Sprawl cut | Retires Make DOM cloning of Guide map / store card for this step |

Agentic CJM still lands on Book Step 2 after Availability Tool; this pilot proves the traditional booking entry and shared Studio wiring.

---

## What was reused

- UXDS tokens + Boots `styleguide/theme.css`
- `ButtonPrimary`, `FilterChip` / `FilterChipGroup`, `Disclosure`
- Existing `AvailabilityTool` for location pick (unchanged overlay)
- Vaccine / recipient popups (same wire state)
- Sticky Proto header + ProtoFooter mounts
- Stable `data-name` hooks for playback (`component.input.field`, `.proto-chosen-slot`, Continue button, progress)

---

## Make vs React (current)

| Screen | Stack |
|--------|--------|
| **Book Step 1 — Location** | **React + UXDS** (Make HTML hidden for this child only) |
| All other Boots screens | Make wire (+ overlays/popups as before) |
| Availability Tool | React overlay (prior enrichment) |

---

## PO verify on localhost

1. `npm run dev` → http://localhost:5173/
2. Open **Boots Pharmacy** → nav tab **Book - Step 1 - Location** (or Traditional CJM → after PDP/login).
3. Confirm React card (search / near-me / Continue); Make absolute layout gone for this tab.
4. Search or Near me → Availability Tool → choose Covent Garden → chosen card + map.
5. Continue → Book Step 2 (Make).
6. Optional: play Traditional CJM through `choose-location` beat.

---

## Code

- `src/projects/boots-pharmacy/screens/book-step1/BookStep1LocationScreen.tsx`
- `src/projects/boots-pharmacy/screens/book-step1/mountBookStep1Screen.tsx`
- Wire mount in `BootsPharmacyProjectView.tsx`
