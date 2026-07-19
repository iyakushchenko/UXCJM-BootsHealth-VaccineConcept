# Frontend standards — React concept screens

**Status:** Locked (Product Owner, 2026-07-19)  
**Audience:** Every agent building or rebuilding concept UI in `src/projects/*`.  
**Companions:** [VISUAL_FIDELITY.md](./VISUAL_FIDELITY.md) · [PAGE_BUILD_CONTRACT.md](./PAGE_BUILD_CONTRACT.md) · [INTERACTION_FIDELITY.md](./INTERACTION_FIDELITY.md) · [FE_UI_UX_AUDIT.md](./FE_UI_UX_AUDIT.md)

---

## 1. Icon + text CTAs (CRITICAL)

Short CTAs with an icon beside a label **must stay on one line**.

| Do | Do not |
|----|--------|
| `display: inline-flex`, `flex-wrap: nowrap`, `align-items: center`, `gap` | Let the label wrap under the icon |
| `white-space: nowrap` on the control (and label span if needed) | `flex-wrap: wrap` on short tertiary CTAs / chips / pills |
| `flex-shrink: 0` on the icon | Shrink the icon so text reflows awkwardly |

Applies to: “See what’s available near me”, Change / Change location, and any similar tertiary icon+text control unless the **source concept** is explicitly multi-line.

### 1.1 One tertiary icon language (CRITICAL)

Sibling **tertiary icon+text** CTAs on the same surface must share **one** icon treatment.

| Rule | Expectation |
|------|-------------|
| **Pick a baseline** | When merging siblings, pick one control as the visual merge target (Book Step 1 Change / pencil: `#AFCCCA` → `#012169` hover) |
| **Match baseline** | Rest fill/stroke color, size (e.g. 16×16), weight (simple line/glyph — **not** a filled dark circular badge), hover color shift |
| **Same string/role → one component** | Identical CTA copy that appears on multiple surfaces must share **one** component — do not fork FilterChip vs tertiary markup |

### 1.2 Near-me CTA (CRITICAL)

**“See what’s available near me”** — Book Step 1 search row **and** Availability Tool search row — **must** use shared `NearMeCta` (`src/projects/boots-pharmacy/chrome/NearMeCta.tsx`).

| Rule | Expectation |
|------|-------------|
| **Source of truth** | Availability popup / Make tertiary beside search (`.proto-tertiary-cta--compact` + 16×16 map-pin + nowrap) — **not** a FilterChip restyle and **not** a Change-pencil one-off fork |
| **Placement** | Right of the search field when the concept shows side-by-side (Make `Frame209` / `.proto-avail-search-row`) |
| **Shared class** | `.proto-near-me-cta` on top of tertiary compact chrome — typography, color, icon, hover stay in sync |

Search-field glyphs inside inputs are a **different** family (field chrome) — do not force them onto the tertiary CTA palette unless the concept ties them together.

### 1.3 Availability list filter pills

Secondary pills (**All locations** / **Slots available**): inactive = quiet outline/neutral; **selected = Boots primary** (`#467672` fill, white on-primary text; hover `#305854`). Keep mini vs List/Map hierarchy. Do **not** use mint `#c6e5e1` for the selected state.

---

## 2. Regular text links (CRITICAL)

Typical underline / blue body links (**Learn more**, **Show on map**, **See working hours**, help tel, forgot-password style) **must** share one pattern. Do not invent per-screen link colors.

| Token | Value |
|-------|--------|
| **Class** | `.uxds-link` (`src/uxds/components/text-link.css`) |
| **Baseline** | Boots Make / Book Step 1 booster **Learn more** |
| **Rest** | `#012169`, `text-decoration: underline`, weight inherit |
| **Hover** | `#01318f`, underline **off** |
| **Focus-visible** | `outline: 2px solid #012169`, `outline-offset: 2px` |

Legacy aliases (same rules): `.proto-avail-link`, `.proto-recipient-picker__link`.

| Family | Do not force into `.uxds-link` |
|--------|--------------------------------|
| Tertiary icon+text CTAs | Change location, near-me — §1 |
| Breadcrumb Home | Teal `#305854` crumb chrome (Make) |
| Make `.proto-link` globals | Still strip underline under `.proto-viewport` — **Make target:** adopt `.uxds-link` when a surface is migrated; do not weaken React parity to match the strip |

---

## 3. Content column / logo alignment

Boots (and matching Studio chrome) use:

```
full-bleed band
  → shell: max-width 1440px, margin auto, padding-left/right 64px
  → inner: max-width 1312px, width 100%, margin auto
```

Same grid as header logo container and `ProtoFooter` (`.proto-footer__shell` / `__shell-inner`).

**Do not** put horizontal `padding: 64px` on the **1312px** inner — that double-insets crumbs and content past the logo edge.

---

## 4. Visual fidelity

Concept L&F is mandatory. See [VISUAL_FIDELITY.md](./VISUAL_FIDELITY.md).

- Rebuilds require a **written design-delta checklist** (§1.2) including **background fills**.
- Prefer Make **computed** styles (live wire CSS) over inventing UXDS-looking backgrounds.

---

## 5. Behavior parity

Screen rebuild = visual + behavior. Migrate every Make interaction that already worked. See [VISUAL_FIDELITY.md](./VISUAL_FIDELITY.md) §1.1 and [INTERACTION_FIDELITY.md](./INTERACTION_FIDELITY.md).

---

## 6. Hover / focus / active

Migrate Make `:hover`, `:focus-visible`, and `:active` (and short transitions) into kit or **co-located screen CSS**. Do not ship flat CTAs/inputs/chips that only paint the resting state.

---

## 7. Scoped CSS

| Do | Do not |
|----|--------|
| Co-locate screen CSS next to the React screen (e.g. `book-step1-location.css`) | Grow monster global sheets for one screen’s chrome |
| Override UXDS defaults **under a screen host** when concept chrome differs | Rewrite UXDS baselines for a one-off look |
| Keep UXDS kit CSS lean and valid (no empty declarations) | Paste Figma export noise / blank rule bodies into shared kits |

---

## 8. Short labels & pills

Use `nowrap` for short CTAs, chips, crumb current labels, and tertiary pills unless the concept shows multi-line text.

---

## Agent checklist (FE)

1. Content shell matches logo column (1440 / 64 / 1312).  
2. Icon+text CTAs are single-line (`inline-flex` + `nowrap`).  
3. Sibling tertiary CTAs share one icon language (baseline chosen and applied).  
4. Same CTA string/role → one shared component (near-me → `NearMeCta`).  
5. Availability secondary filter selected state uses primary brand colors.  
6. Regular text links use `.uxds-link` (one navy/underline pattern — §2).  
7. Hover/focus/active ported from Make.  
8. Design-delta table written (fills in scope).  
9. Behavior parity verified.  
10. CSS scoped to the screen/kit — build still passes.
