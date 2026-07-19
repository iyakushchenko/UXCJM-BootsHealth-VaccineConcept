# PLP Make → React parity register

**Project:** `boots-pharmacy`  
**Callsigns:** Bea (BA) owns register · Quinn (QA) owns prove · Finn/Uma restore gaps  
**Updated:** 2026-07-19  
**Make source:** Frame child **9** (`Product - Vaccination Listing Page`) + `globals-screens` `.proto-plp-*` + `data/plpListing.ts` wire  
**React target:** `src/projects/boots-pharmacy/screens/plp/*`  
**Refs:** [PLP_REACT.md](./PLP_REACT.md) · audit [../audits/FE_AUDIT_PLP_2026-07-19.md](../audits/FE_AUDIT_PLP_2026-07-19.md)

**Status legend:** Present · Partial · Missing · N/A

---

## Layout

| # | Make behavior | React status | Evidence |
|---|---------------|--------------|----------|
| L1 | **Page bg fill** — `module.laptop.specs`: white base + decorative PNG (`imgBody1`) @ opacity **0.41**, object-bottom | **Missing → Fixed** | Make `ModuleLaptopSpecs` frame L11367–11373. React was flat `--uxds-surface-neutral` only (`plp.css` `.plp__body`). Restored `plp__body-fill` + same asset. |
| L2 | **Category title block + large shadow** — teal hero band (`module.plp.hero`, 296px) stands above listing; needs clear lift vs patterned body | **Partial → Fixed** | Make hero present (teal + title/lede/media). React hero present but no lift shadow. Added bottom shadow on `.plp__hero`. |
| L3 | **Listing wrapper** — `Body8` `data-name="body"`: white, `rounded-[24px]`, `drop-shadow-[0px_5px_9.75px_rgba(0,0,0,0.05)]`, pad 24px around tiles | **Missing → Fixed** | Make `Body8` L11346–11355. React tiles sat bare in `.plp__results`. Restored `.plp__listing` wrapper. |
| L4 | **Product list preloader / skeleton sim** — on filter change: overlay spinner “Updating results…”, hide tiles ~450ms, stagger reveal | **Missing → Fixed** | Make `plpListing.ts` `beginPlpListingLoading` / `PLP_LISTING_LOAD_MS=450` + `globals-screens` loader CSS. React skipped (audit residual). Ported into `PlpScreen` + `plp.css` (no LEGACY growth). |
| L5 | **Advantage Card points banner** — mint `#c4dde3` system message above filters/listing | **Missing** | Make L11375–11384. Not journey-critical for Traditional PLP→PDP; residual. |
| L6 | **AI Assistant promo strip** below listing (`ModuleLaptopSpecs1` / Week Schedule) | **Missing** | Make L11494–11503. Marketing chrome; residual (not CJM). |
| L7 | **Filters column** 304px accordion (By Type / Age / Disease / Region / Country) | **Present** | `PlpScreen` + UXDS Accordion; `data-name="module.plp.filters"`. |
| L8 | **Filter search** (disease / country) + clear | **Present** | `FilterSearch` in disease/country sections. |
| L9 | **Results summary** count copy + reset when dirty | **Partial → Fixed** | Count present; Make also shows removable **filter chips** + “Reset Filters” tertiary in summary row (`renderPlpResultsSummary`). Chips + summary reset restored. |
| L10 | **Service tiles** (title, subtitle, desc, price, Book now, Bookmarks, Quick View) | **Present** | `ServiceTile`; `data-name="boots-pharmacy.service.tile"`. Tile pad Make 16px vs React 24px → aligned to 16px. |
| L11 | **Empty state** when filters yield zero | **Present** | `.plp__empty` copy. |
| L12 | **1440 / 64 / 1312 content grid** | **Present** | `.plp__shell` / `__shell-inner`. |
| L13 | **Breadcrumbs** Home → Vaccinations | **Present** | `module.breadcrumbs`; Home → `onGoHome`. |
| L14 | **Catalog depth** ~21 Make jab tiles vs React curated set | **Partial** | React `PLP_JAB_ITEMS` ~10; documented residual (expand if CJM scrape needs full set). |

---

## Interactions

| # | Make behavior | React status | Evidence |
|---|---------------|--------------|----------|
| I1 | **By Type radios** — Individual jabs / Bundles | **Present** | `RadioRow` + `showBundles`. |
| I2 | **By Age** — All ages radio + age checkboxes | **Present** | `allAges` / `ages`. |
| I3 | **Disease / region / country checkboxes** narrow listing | **Present** | `filterPlpCatalog`. |
| I4 | **Active filter chips** in results summary — click removes facet | **Missing → Fixed** | Make `proto-plp-filter-chip` + `removePlpFilterChip`. Restored removable chips in React summary. |
| I5 | **Reset filters** | **Present** | Sidebar reset + summary Reset Filters when dirty. |
| I6 | **View all** expand on long checkbox lists | **Missing** | Make `component.plp.filter.view-all`. Residual (lists short in React catalog). |
| I7 | **Sort control** | **N/A** | Not in Make PLP. |
| I8 | **Tile title / Book now → PDP** | **Present** | `onBookNow` → wire `setCurrent(INDEX_PDP)`. |
| I9 | **Quick View** → RTB popup | **Present** | `onQuickView` → `openQuickView()`. |
| I10 | **Wishlist / Add to Bookmarks** heart toggle | **Present** | `toggleWishlist(plpTileWishlistId)`; wire skips React hearts. |
| I11 | **Bundles mode** shows bundle tiles | **Present** | `PLP_BUNDLE_CATALOG` / filter. |
| I12 | **Listing load sim on filter change** | **Missing → Fixed** | See L4. |
| I13 | **Stagger tile reveal after load** | **Missing → Fixed** | Make `--proto-plp-stagger` + `proto-plp-tile-in`. Ported under `.plp` scope. |
| I14 | **Scroll** page / listing | **Present** | Normal document scroll; Studio sticky header. |
| I15 | **Near me** | **N/A** | Book Step 1 only (not on Make PLP). |
| I16 | **Keyboard / a11y basics** — focus-visible, radio roles, accordion | **Present** | `:focus-visible` on controls; radios `role="radio"`; Accordion kit. |
| I17 | **Accordion open/close** filter sections | **Present** | UXDS Accordion default all open. |

---

## Wire / CJM hooks (must still fire)

| # | Hook | React status | Evidence |
|---|------|--------------|----------|
| W1 | `data-studio-react-screen="plp"` mount; Make children `data-studio-make-retired="plp"` | **Present** | `mountPlpScreen`. |
| W2 | Make PLP Book / Quick View / title / hearts / filter DOM sync **early-return** when React mounted | **Present** | `isPlpReactMounted()` gates in `BootsPharmacyProjectView` + `inputControls`. |
| W3 | URL `?project=boots-pharmacy&screen=plp` | **Present** | Engine screen registry `screenId: plp`. |
| W4 | Recording `kind: "screen"` `plp` | **Present** | Engine screen events. |
| W5 | Traditional CJM tile scrape via `boots-pharmacy.service.tile` | **Present** | React tiles keep `data-name`; playback `traditional.ts`. |
| W6 | `PLP_FILTERS_CHANGE_EVENT` / dirty → Studio chrome | **Present** | `onFiltersDirtyChange` → `plpFiltersDirty`. |
| W7 | Wishlist IDs `plp-tile-N` shared with header | **Present** | `plpTileWishlistId`. |
| W8 | Footer Vaccinations → PLP | **Present** | `setupFooters({ onGoToPlp })`. |
| W9 | Chat “Go to vaccines catalog” → PLP | **Present** | Wire `setCurrent(INDEX_PLP)`. |

---

## Journey-critical Missing (PO restore set)

| Priority | Item | Outcome this ship |
|----------|------|-------------------|
| P0 | L1 page bg fill | **Fixed** |
| P0 | L2 hero / category title shadow lift | **Fixed** |
| P0 | L3 listing wrapper | **Fixed** |
| P0 | L4 / I12 / I13 preloader + stagger | **Fixed** |
| P1 | I4 active filter chips | **Fixed** |
| P2 | L5 Advantage banner | Residual |
| P2 | L6 AI promo strip | Residual |
| P2 | I6 View all | Residual |
| P2 | L14 catalog count Partial | Residual |

---

## Prove matrix (Quinn)

| Item | Localhost | Pages |
|------|-----------|-------|
| L1–L4, I4, I8–I11, W1–W5 | Required this ship | Note after deploy |
| L5–L6, I6, L14 | Residual OK | — |

**Fail ship if:** Book→PDP, Quick View, Bundles, wishlist, or Make leak under React host regress.
