# Boots Pharmacy — project styleguide (brand delta)

**Project id:** `boots-pharmacy`  
**Scope:** `[data-proto-project="boots-pharmacy"]` via `theme.css`

**Rule:** Visual L&F of the source concept is mandatory; brand may override UXDS color tokens in `theme.css`.

## Brand facts

| Role | Value | Notes |
|------|-------|--------|
| Primary teal | `#467672` | Brand mid |
| Primary darkest | `#305854` | Buttons / strong accents (UXDS Concept primary solid) |
| Primary light | `#AFCCCA` | Secondary borders, badges, selected chips |
| Commerce navy CTA | `#012169` | Existing Make wire primary CTAs (kept; not forced onto UXDS primary solid) |

## Concept visual fidelity (locked)

Rebuilds must **look like the existing Make / concept pages**, not a cleaner generic DS restyle. Remap UXDS colors via this theme; do not redesign chrome.

| Control | Source look (Book Step 1 Make) | Do not |
|---------|--------------------------------|--------|
| **Search / text fields** | Pill: `border-radius: 360px`, border `#c3c3c3` | Sharp / `border-radius: 0`, inventing a new radius |
| **Progress stepper** | Flat 8px bars — active `#c6e5e1`, inactive `#ffffff`; ~560px row; 10px labels | UXDS-styled track with radius/border |
| **Checkbox** | 24×24, `border-radius: 2px`; unchecked white/`#afafaf`; checked fill `#c6e5e1` + mark `#3A3A3A` | Native OS checkbox / DS accent-color restyle |
| **Primary CTA** | Navy pill `#012169`, `border-radius: 360px` | Teal-only “DS primary” restyle |

Measure from Make classes / live wire CSS. Document PO-approved deltas here only.

## Files

| File | Role |
|------|------|
| `theme.css` | Remaps UXDS semantic roles → Boots brand |
| `assets/` | Logos (add when needed) |

## Agent rule

Build with UXDS structure + this delta. Visible styling follows the Boots concept source. Do not hardcode Boots teal into other projects. See [docs/product/PROJECT_STYLEGUIDE.md](../../../../docs/product/PROJECT_STYLEGUIDE.md) and [PAGE_BUILD_CONTRACT.md](../../../../docs/product/PAGE_BUILD_CONTRACT.md) §5.
