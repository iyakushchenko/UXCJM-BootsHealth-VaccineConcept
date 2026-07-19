# Page build contract — React + UXDS

**Status:** Locked direction (Product Owner, 2026-07-19)  
**Applies to:** Concept UI inside `src/projects/<project-id>/`  
**Ready to consume a concept frame?** Yes — first frame also stands up `src/uxds/` token bridge + React module pattern. Existing Boots Make wire stays until replaced screen-by-screen.  
**Intake:** PO feeds are often early/messy; agent upgrades — [CONCEPT_INTAKE.md](./CONCEPT_INTAKE.md).

---

## 1. North star

Every client-facing concept screen in Studio is **React** expressed through **UXDS** (tokens + closest modules) — even when the Figma source was rough.

```
Early concept (messy OK)  →  Agent: React + UXDS upgrade  →  Project screens  →  Journeys / recording
```

Figma Make / static strips are **intent only**. Not the architecture we grow.

---

## 2. What “full fledged design system” means here

| Concern | Expectation |
|---------|-------------|
| **Variables** | UXDS semantic names for structure; **project theme** remaps brand colors/logos ([PROJECT_STYLEGUIDE.md](./PROJECT_STYLEGUIDE.md)) |
| **Components** | Buttons, inputs, cards, modals, nav patterns as reusable React modules — not per-screen copy-paste |
| **Interaction** | Anticipated controls must work before recording is expected — shared kits under `src/uxds/interactions/` ([INTERACTION_FIDELITY.md](./INTERACTION_FIDELITY.md)) |
| **Reuse** | Maximize UXDS + internal ready components + interaction kits; when PO asks for a page “from what we have,” compose — don’t invent ([CONCEPT_INTAKE.md](./CONCEPT_INTAKE.md) §5 mode B) |
| **Patterns** | Styleguide patterns reused across projects; brand identity stays in the project delta |
| **Wiring for Studio** | Stable `data-name` / `data-proto-*` / screen registry so playback + recording keep working |

---

## 3. Engine vs project pages

| Surface | Stack | Design system |
|---------|-------|---------------|
| **Studio shell** (`src/app/`) | React | Lean chrome OK; may adopt UXDS tokens later for consistency |
| **Concept pages** (`src/projects/*`) | React | UXDS structure + **project styleguide delta** for brand |

Playback, orchestra, and recording attach to **stable selectors and screen ids**, not to Make’s absolute positioning quirks.

---

## 4. Boots today vs target

| Today (test rabbit) | Target |
|---------------------|--------|
| Large Make-derived wire / DOM overlays | React screens composed from UXDS components |
| Imperative DOM scripts for many interactions | React state + **shared interaction kits** (`src/uxds/interactions/`); small DOM bridges only where Studio needs them — not per-screen script sprawl |
| Fast demo value | Same demo value **plus** maintainable, design-system-aligned UI |

Boots remains the **first rabbit**: we prove the rebuild pipeline on Boots, then apply it to the next project.

---

## 5. Visual fidelity (locked — PO)

**Visual look & feel of the source concept is mandatory.** Aesthetic DS “upgrades” are not.

- Stick to the previous concept look (Make / live wire) — progress, search, buttons, checkboxes, spacing, radii — even if it feels “shitty.”
- Do **not** restyle toward a cleaner generic DS look.
- UXDS is for **structure and reuse under the hood**; **visible chrome must match the source page** (measure from original CSS / Make — do not invent).
- **Brand may remap UXDS color tokens** via the project theme (`styleguide/theme.css`) so semantic roles carry Boots/concept colors — that is expected, not a license to redesign chrome.
- Document intentional deltas only when the PO asks to change the concept look.

---

## 6. Build order for a screen (agent checklist)

1. Open PO concept URL; classify early strip vs structured page ([CONCEPT_INTAKE.md](./CONCEPT_INTAKE.md)).
2. Extract intent (flow, hypothesis) — do not require DS-perfect source.
3. Map regions → UXDS tokens + closest `component.*` / `module.*`.
4. Compose React screen; **match concept visuals**; use UXDS for structure/reuse, not a visual redesign.
5. **Build anticipated interactivity** from page context (and CJM deck when provided) via shared kits — CTAs, filters, accordions, forms, etc. ([INTERACTION_FIDELITY.md](./INTERACTION_FIDELITY.md)). Prefer library reuse over one-off scripts.
6. Register screen + `data-*` hooks for cursor, touchpoints, recording.
7. Wire journey beats / scripts as needed (thin; not duplicate DS behavior).
8. Smoke: browse + happy-path controls respond + one playback path that hits the screen.
9. Only then treat the page as **record-ready**.

---

## 7. What we will not do

- Grow new concept features as permanent Make HTML.
- Invent a second parallel design system in code that ignores UXDS names.
- Refuse a concept because Figma “isn’t on the DS yet” — **filling that gap is the job**.
- “Improve” concept visuals with generic DS polish (rounded cards, sharper inputs, new color ramps) unless the PO asks.
- Grow gigantic custom imperative scripts per screen that duplicate accordion/dropdown/filter/modal behavior — extend `src/uxds/interactions/` instead.
- Expect recording on pages that lack the interactive components the scenario needs.
- Block **engine** work on a full Boots rewrite.

---

## Related

- [CONCEPT_INTAKE.md](./CONCEPT_INTAKE.md) — business intake logic
- [INTERACTION_FIDELITY.md](./INTERACTION_FIDELITY.md) — recording prerequisite + shared behavior library
- [UXDS_ACCESS.md](./UXDS_ACCESS.md)
- [PRODUCT_OWNER_BRIEF.md](./PRODUCT_OWNER_BRIEF.md)
- [../shell/PROJECTS.md](../shell/PROJECTS.md)
