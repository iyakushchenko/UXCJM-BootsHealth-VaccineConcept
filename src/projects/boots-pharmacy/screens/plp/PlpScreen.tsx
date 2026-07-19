import { useEffect, useMemo, useState } from "react";
import plpHeroImage from "@/projects/boots-pharmacy/frame/5b75d20d7a0df34031ca23477a68cf97cac4938d.png";
import {
  isInWishlist,
  plpTileWishlistId,
  toggleWishlist,
} from "@/projects/boots-pharmacy/chrome/headerMount";
import { ButtonPrimary } from "@/uxds/components";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/uxds/interactions";
import {
  DEFAULT_PLP_FILTERS,
  PLP_AGE_OPTIONS,
  PLP_BUNDLE_CATALOG,
  PLP_COUNTRY_OPTIONS,
  PLP_DISEASE_OPTIONS,
  PLP_JAB_ITEMS,
  PLP_REGION_OPTIONS,
  filterOptionList,
  filterPlpCatalog,
  isPlpFiltersDirty,
  togglePlpFilterValue,
  type PlpCatalogItem,
  type PlpFilterState,
} from "./plpCatalog";
import { PLP_REACT_SCREEN_ID } from "./plpContract";
import "./plp.css";

export type PlpScreenProps = {
  onBookNow: (item: PlpCatalogItem) => void;
  onQuickView: (item: PlpCatalogItem) => void;
  onGoHome: () => void;
  onFiltersDirtyChange?: (dirty: boolean) => void;
};

function ChevronGlyph() {
  return (
    <span className="plp__chevron" aria-hidden>
      <svg width="16" height="10" viewBox="0 0 16 10" fill="none">
        <path
          d="M1.2 1.2 8 8.2l6.8-7"
          stroke="#5C5C5C"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}

function BookmarkGlyph() {
  return (
    <svg width="16" height="14" viewBox="0 0 16 14" aria-hidden>
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        fill="currentColor"
        d="M8.97666 0.739019C8.65666 0.958352 8.3648 1.22079 8.1094 1.51851L7.9994 1.65068C7.7186 1.29817 7.38906 0.990592 7.023 0.739545C6.16554 0.151519 5.10788 -0.126355 4.00824 0.0548652C3.46077 0.146165 2.92962 0.331285 2.43333 0.607132C1.93684 0.881965 1.49417 1.23659 1.12197 1.65503C-0.520466 3.50007 -0.32604 6.37247 1.48489 7.99807L1.61087 8.10693C1.8692 8.3232 2.1194 8.54207 2.35995 8.76253L8 14L13.642 8.7614C13.8817 8.54007 14.1302 8.32287 14.3873 8.10947C16.3162 6.50553 16.5585 3.54285 14.8775 1.65471C14.5067 1.23784 14.0648 0.884092 13.5664 0.607105C13.1395 0.369819 12.6875 0.199439 12.2241 0.0991519L11.9915 0.0548652C10.8915 -0.126435 9.83333 0.151765 8.97666 0.739019Z"
      />
    </svg>
  );
}

function EyeGlyph() {
  return (
    <svg width="16" height="10" viewBox="0 0 16 10" aria-hidden>
      <path
        fill="currentColor"
        d="M8 0C4.5 0 1.6 2.1 0 5c1.6 2.9 4.5 5 8 5s6.4-2.1 8-5c-1.6-2.9-4.5-5-8-5Zm0 8.2A3.2 3.2 0 1 1 8 1.8a3.2 3.2 0 0 1 0 6.4Z"
      />
    </svg>
  );
}

function RadioRow({
  checked,
  label,
  count,
  onSelect,
}: {
  checked: boolean;
  label: string;
  count: number;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      className="plp__option-row"
      data-name="component.input.radio"
      data-radio-checked={String(checked)}
      aria-checked={checked}
      role="radio"
      onClick={onSelect}
    >
      <span className={`plp__radio${checked ? " is-on" : ""}`} aria-hidden />
      <span className="plp__option-label">{label}</span>
      <span className="plp__option-count">{count}</span>
    </button>
  );
}

function CheckboxRow({
  checked,
  label,
  onToggle,
}: {
  checked: boolean;
  label: string;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      className="plp__option-row"
      data-name="component.plp.filter.checkbox.item"
      onClick={onToggle}
    >
      <span
        className={`plp__checkbox${checked ? " is-on" : ""}`}
        data-name="component.input.checkbox"
        data-checkbox-checked={String(checked)}
        data-studio-react-owned="true"
        aria-hidden
      />
      <span className="plp__option-label" data-name="Label">
        <span>{label}</span>
      </span>
    </button>
  );
}

function FilterSearch({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (next: string) => void;
  placeholder: string;
}) {
  return (
    <label
      className="plp__search"
      data-name="component.input.field"
      data-studio-react-owned="true"
    >
      <input
        className="plp__search-input proto-search-input"
        type="search"
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        aria-label={placeholder}
      />
      {value ? (
        <button
          type="button"
          className="plp__search-clear"
          aria-label="Clear search"
          onClick={() => onChange("")}
        >
          ×
        </button>
      ) : null}
    </label>
  );
}

function ServiceTile({
  item,
  tileIndex,
  wishlisted,
  onToggleWishlist,
  onBookNow,
  onQuickView,
}: {
  item: PlpCatalogItem;
  tileIndex: number;
  wishlisted: boolean;
  onToggleWishlist: () => void;
  onBookNow: () => void;
  onQuickView: () => void;
}) {
  return (
    <article
      className="plp__tile"
      data-name="boots-pharmacy.service.tile"
      data-studio-plp-tile-id={item.id}
      data-studio-plp-tile-index={String(tileIndex)}
    >
      <div className="plp__tile-main">
        <div className="plp__tile-copy">
          <div className="plp__tile-titles">
            <a
              href="#pdp"
              className="plp__tile-title-link proto-plp-tile-title-link"
              data-name="component.plp.tile.title"
              onClick={(e) => {
                e.preventDefault();
                onBookNow();
              }}
            >
              <p className="plp__tile-title">{item.title}</p>
            </a>
            <p className="plp__tile-subtitle">{item.subtitle}</p>
          </div>
          <p className="plp__tile-desc">{item.description}</p>
          <div className="plp__tile-tertiaries">
            <button
              type="button"
              className="plp__tertiary"
              data-name="component.input.button"
              data-studio-wishlist-id={plpTileWishlistId(tileIndex)}
              aria-pressed={wishlisted}
              onClick={onToggleWishlist}
            >
              <span
                className={`plp__tertiary-icon${wishlisted ? " is-active" : ""}`}
                data-name="icon=add to wishlist"
                data-fav-active={String(wishlisted)}
              >
                <BookmarkGlyph />
              </span>
              <span>Add to Bookmarks</span>
            </button>
            <button
              type="button"
              className="plp__tertiary"
              data-name="component.input.button"
              data-studio-quick-view="true"
              onClick={onQuickView}
            >
              <span className="plp__tertiary-icon" data-name="icon=view">
                <EyeGlyph />
              </span>
              <span>Quick View</span>
            </button>
          </div>
        </div>
        <div className="plp__tile-buy">
          <div className="plp__price-block">
            <p className="plp__price-note">{item.priceNote}</p>
            <div
              className="plp__price"
              data-name="component.product.price"
            >
              <span>£</span>
              <span>{item.price.replace(/^£/, "")}</span>
            </div>
            {item.accent ? (
              <p className="plp__price-accent">{item.accent}</p>
            ) : null}
          </div>
          <ButtonPrimary
            className="plp__book uxds-btn-primary--commerce"
            data-studio-action="plp-book-now"
            onClick={onBookNow}
          >
            Book now
          </ButtonPrimary>
        </div>
      </div>
    </article>
  );
}

/**
 * React + UXDS PLP — Vaccinations listing.
 * Retires Make HTML for Frame child 9; Studio hooks via data-name.
 */
export function PlpScreen({
  onBookNow,
  onQuickView,
  onGoHome,
  onFiltersDirtyChange,
}: PlpScreenProps) {
  const [filters, setFilters] = useState<PlpFilterState>(DEFAULT_PLP_FILTERS);
  const [wishlistTick, setWishlistTick] = useState(0);

  const items = useMemo(() => filterPlpCatalog(filters), [filters]);
  const dirty = isPlpFiltersDirty(filters);

  useEffect(() => {
    onFiltersDirtyChange?.(dirty);
  }, [dirty, onFiltersDirtyChange]);

  const diseaseOptions = filterOptionList(
    PLP_DISEASE_OPTIONS,
    filters.diseaseQuery
  );
  const countryOptions = filterOptionList(
    PLP_COUNTRY_OPTIONS,
    filters.countryQuery
  );

  return (
    <div
      className="plp"
      data-name="body"
      data-studio-react-screen={PLP_REACT_SCREEN_ID}
    >
      <div className="plp__crumbs" data-name="module.breadcrumbs">
        <div className="plp__shell">
          <nav
            className="plp__shell-inner plp__crumbs-inner"
            data-name="component.breadcrumbs"
            aria-label="Breadcrumb"
          >
            <button
              type="button"
              className="plp__crumb-link"
              onClick={onGoHome}
            >
              Home
            </button>
            <span className="plp__crumb-sep" aria-hidden>
              /
            </span>
            <span className="plp__crumb-current">Vaccinations</span>
          </nav>
        </div>
      </div>

      <section className="plp__hero" data-name="module.plp.hero">
        <div className="plp__hero-bg" data-name="component.plp.hero.bg" aria-hidden>
          <img src={plpHeroImage} alt="" />
        </div>
        <div className="plp__shell plp__hero-shell">
          <div className="plp__shell-inner plp__hero-inner">
            <div className="plp__hero-copy">
              <h1 className="plp__hero-title">Vaccinations</h1>
              <p className="plp__hero-lede">
                Find and book trusted vaccination services for travel, seasonal
                protection, and routine health needs.
              </p>
            </div>
            <div className="plp__hero-media" aria-hidden>
              <img src={plpHeroImage} alt="" />
            </div>
          </div>
        </div>
      </section>

      <div className="plp__body">
        <div className="plp__shell">
          <div className="plp__shell-inner plp__layout">
            <aside
              className="plp__filters"
              data-name="module.plp.filters"
              data-studio-react-owned="true"
            >
              <Accordion
                type="multiple"
                defaultValue={["type", "age", "disease", "region", "country"]}
                className="plp__filter-accordion"
                data-name="plp.filter.accordion"
              >
                <AccordionItem id="type" className="plp__filter-section">
                  <AccordionTrigger id="type" className="plp__filter-trigger">
                    <span>By Type</span>
                    <ChevronGlyph />
                  </AccordionTrigger>
                  <AccordionContent id="type" className="plp__filter-content">
                    <div className="plp__option-list" data-name="list" role="radiogroup">
                      <RadioRow
                        checked={!filters.showBundles}
                        label="Individual jabs"
                        count={PLP_JAB_ITEMS.length}
                        onSelect={() =>
                          setFilters({ ...filters, showBundles: false })
                        }
                      />
                      <RadioRow
                        checked={filters.showBundles}
                        label="Bundles"
                        count={PLP_BUNDLE_CATALOG.length}
                        onSelect={() =>
                          setFilters({ ...filters, showBundles: true })
                        }
                      />
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem id="age" className="plp__filter-section">
                  <AccordionTrigger id="age" className="plp__filter-trigger">
                    <span>By Age</span>
                    <ChevronGlyph />
                  </AccordionTrigger>
                  <AccordionContent id="age" className="plp__filter-content">
                    <div className="plp__option-list" data-name="list">
                      <RadioRow
                        checked={filters.allAges}
                        label="All age groups"
                        count={PLP_JAB_ITEMS.length}
                        onSelect={() =>
                          setFilters({
                            ...filters,
                            allAges: true,
                            ages: [],
                          })
                        }
                      />
                      {PLP_AGE_OPTIONS.map((label) => (
                        <CheckboxRow
                          key={label}
                          checked={filters.ages.includes(label)}
                          label={label}
                          onToggle={() =>
                            setFilters(
                              togglePlpFilterValue(filters, "ages", label)
                            )
                          }
                        />
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem id="disease" className="plp__filter-section">
                  <AccordionTrigger id="disease" className="plp__filter-trigger">
                    <span>By Disease</span>
                    <ChevronGlyph />
                  </AccordionTrigger>
                  <AccordionContent id="disease" className="plp__filter-content">
                    <FilterSearch
                      value={filters.diseaseQuery}
                      onChange={(diseaseQuery) =>
                        setFilters({ ...filters, diseaseQuery })
                      }
                      placeholder="Search diseases"
                    />
                    <div className="plp__option-list" data-name="list">
                      {diseaseOptions.map((label) => (
                        <CheckboxRow
                          key={label}
                          checked={filters.diseases.includes(label)}
                          label={label}
                          onToggle={() =>
                            setFilters(
                              togglePlpFilterValue(filters, "diseases", label)
                            )
                          }
                        />
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem id="region" className="plp__filter-section">
                  <AccordionTrigger id="region" className="plp__filter-trigger">
                    <span>By Region</span>
                    <ChevronGlyph />
                  </AccordionTrigger>
                  <AccordionContent id="region" className="plp__filter-content">
                    <div className="plp__option-list" data-name="list">
                      {PLP_REGION_OPTIONS.map((label) => (
                        <CheckboxRow
                          key={label}
                          checked={filters.regions.includes(label)}
                          label={label}
                          onToggle={() =>
                            setFilters(
                              togglePlpFilterValue(filters, "regions", label)
                            )
                          }
                        />
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem id="country" className="plp__filter-section">
                  <AccordionTrigger id="country" className="plp__filter-trigger">
                    <span>By Country</span>
                    <ChevronGlyph />
                  </AccordionTrigger>
                  <AccordionContent id="country" className="plp__filter-content">
                    <FilterSearch
                      value={filters.countryQuery}
                      onChange={(countryQuery) =>
                        setFilters({ ...filters, countryQuery })
                      }
                      placeholder="Search countries"
                    />
                    <div className="plp__option-list" data-name="list">
                      {countryOptions.map((label) => (
                        <CheckboxRow
                          key={label}
                          checked={filters.countries.includes(label)}
                          label={label}
                          onToggle={() =>
                            setFilters(
                              togglePlpFilterValue(filters, "countries", label)
                            )
                          }
                        />
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>

              {dirty ? (
                <button
                  type="button"
                  className="plp__reset uxds-link"
                  data-name="component.plp.reset-filters"
                  onClick={() => setFilters(DEFAULT_PLP_FILTERS)}
                >
                  Reset filters
                </button>
              ) : null}
            </aside>

            <div className="plp__results">
              <div
                className="plp__results-summary"
                data-name="component.filter.controls"
              >
                <p
                  className="plp__results-count proto-plp-results-count--in"
                  data-studio-plp-results={String(items.length)}
                >
                  {items.length} service
                  {items.length === 1 ? "" : "s"} available for the selected
                  filters
                </p>
              </div>
              <div
                className="plp__tiles-host proto-plp-tiles-host"
                data-name="module.plp.tiles"
              >
                {items.map((item, tileIndex) => {
                  const wishId = plpTileWishlistId(tileIndex);
                  const wishlisted =
                    wishlistTick >= 0 && isInWishlist(wishId);
                  return (
                    <ServiceTile
                      key={item.id}
                      item={item}
                      tileIndex={tileIndex}
                      wishlisted={wishlisted}
                      onToggleWishlist={() => {
                        toggleWishlist(wishId);
                        setWishlistTick((n) => n + 1);
                      }}
                      onBookNow={() => onBookNow(item)}
                      onQuickView={() => onQuickView(item)}
                    />
                  );
                })}
                {!items.length ? (
                  <p className="plp__empty">
                    No services match these filters. Try resetting filters.
                  </p>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
