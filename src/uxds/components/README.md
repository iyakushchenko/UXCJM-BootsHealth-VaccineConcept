# UXDS React components

Visual modules mapped to UXDS `component.*` / `module.*` names. Grow by use — do not mirror the whole Figma library.

| Module | UXDS name | Notes |
|--------|-----------|-------|
| `ButtonPrimary` | `component.input.button` | Token-backed primary CTA + Make hover/active lift (`button-primary.css`) |
| Filter chip styles | `uxds.interaction.filter-chip` | Baseline chip chrome + hover in `filter-chip.css` (screens remap) |

Pair with behavior kits under `../interactions/`. See [docs/uxds/COMPONENTS.md](../../../docs/uxds/COMPONENTS.md).

Kit CSS stays small and co-imported from `src/styles/index.css` — not a per-screen Make monster sheet.
