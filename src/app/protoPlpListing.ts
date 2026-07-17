export type PlpBundleItem = {
  title: string;
  subtitle: string;
  description: string;
  price: string;
  savings: string;
  regions: string[];
  countries: string[];
  searchTerms: string[];
};

/** Dummy bundle rows — aligned to Sarah Jenkins / Southeast Asia travel persona. */
export const PLP_BUNDLE_ITEMS: PlpBundleItem[] = [
  {
    title: "Southeast Asia Vaccine Bundle",
    subtitle: "Indonesia, Thailand, Malaysia & wider region",
    description:
      "Full travel course for a multi-stop Southeast Asia trip: Hepatitis A, Typhoid, and Tetanus booster, plus a Boots travel health review.",
    price: "245.00",
    savings: "Save up to 18% vs individual jabs",
    regions: ["South-East Asia", "Western Pacific"],
    countries: ["Thailand", "Malaysia", "Indonesia", "Philippines"],
    searchTerms: ["southeast asia", "indonesia", "bundle", "hepatitis", "typhoid"],
  },
  {
    title: "Indonesia Explorer Bundle",
    subtitle: "Bali, Java & Lombok itineraries",
    description:
      "Focused protection for island-hopping in Indonesia — Hepatitis A, Typhoid, and Tetanus booster with Yellow Fever guidance where needed.",
    price: "229.00",
    savings: "Includes travel health review",
    regions: ["South-East Asia"],
    countries: ["Indonesia", "Malaysia"],
    searchTerms: ["indonesia", "bali", "explorer"],
  },
  {
    title: "Family Travel Health Bundle",
    subtitle: "Up to 4 travellers · shared appointment",
    description:
      "Book core travel vaccines together for the family before a long-haul holiday.",
    price: "399.00",
    savings: "Best value for multi-traveller trips",
    regions: ["Europe", "Americas", "South-East Asia"],
    countries: ["Thailand", "Malaysia", "Indonesia", "Philippines"],
    searchTerms: ["family", "travel"],
  },
  {
    title: "Hajj & Umrah Health Bundle",
    subtitle: "Meningitis ACWY · Hep A · seasonal flu",
    description:
      "Required and recommended vaccinations for pilgrimage travel, bundled with pharmacist advice on timing ahead of departure.",
    price: "275.00",
    savings: "Certificate support included",
    regions: ["Eastern Mediterranean", "Africa"],
    countries: ["Malaysia", "Indonesia"],
    searchTerms: ["hajj", "umrah", "meningitis"],
  },
  {
    title: "Africa Safari Bundle",
    subtitle: "Yellow Fever · Typhoid · Hep A",
    description:
      "Safari and sub-Saharan travel essentials in one package, including Yellow Fever certificate support.",
    price: "265.00",
    savings: "Yellow Fever certificate eligible",
    regions: ["Africa"],
    countries: ["Thailand"],
    searchTerms: ["africa", "safari", "yellow fever"],
  },
  {
    title: "European City Break Bundle",
    subtitle: "Short-stay urban travel",
    description:
      "Light-touch protection for long weekend breaks — Tetanus booster refresh plus a quick travel health check.",
    price: "95.00",
    savings: "Quick appointment slots",
    regions: ["Europe"],
    countries: ["Philippines"],
    searchTerms: ["europe", "city break"],
  },
  {
    title: "Long Haul Business Bundle",
    subtitle: "Hep A/B · Typhoid · priority booking",
    description:
      "For frequent flyers who need core cover fast — combined Hepatitis A/B, Typhoid, and priority appointment access.",
    price: "210.00",
    savings: "Priority appointment access",
    regions: ["Americas", "Western Pacific", "Europe"],
    countries: ["Malaysia", "Philippines"],
    searchTerms: ["business", "long haul", "hepatitis"],
  },
];

type TileFilterMeta = {
  ages: string[];
  diseases: string[];
  regions: string[];
  countries: string[];
};

type ActivePlpFilters = {
  showBundles: boolean;
  ages: string[] | null;
  diseases: string[];
  regions: string[];
  countries: string[];
};

const PLP_SCREEN_SELECTOR = ".proto-viewport > div > div:nth-child(9)";
const PLP_TILE_SELECTOR = `${PLP_SCREEN_SELECTOR} [data-name="boots-pharmacy.service.tile"]`;
const PLP_FILTERS_SELECTOR = '[data-name="module.plp.filters"]';

function findFilterSection(
  root: ParentNode,
  titlePattern: RegExp
): HTMLElement | null {
  const module = root.querySelector(PLP_FILTERS_SELECTOR);
  if (!module) return null;

  for (const section of module.querySelectorAll<HTMLElement>(
    '[data-name="component.plp.filter.custom"], [data-name="component.plp.filter.brands"]'
  )) {
    if (titlePattern.test(section.textContent ?? "")) return section;
  }
  return null;
}

function findByTypeFilterList(root: ParentNode = document): HTMLElement | null {
  return findFilterSection(root, /by type/i)?.querySelector<HTMLElement>(
    '[data-name="list"]'
  ) ?? null;
}

function radioLabel(row: HTMLElement): string {
  return (row.querySelector("p")?.textContent ?? "").trim();
}

function isVisibleFilterCheckboxItem(item: HTMLElement): boolean {
  return item.style.display !== "none";
}

function readCheckedCheckboxLabels(section: HTMLElement): string[] {
  const labels: string[] = [];
  section
    .querySelectorAll<HTMLElement>('[data-name="component.plp.filter.checkbox.item"]')
    .forEach((item) => {
      if (!isVisibleFilterCheckboxItem(item)) return;
      const row = item.querySelector<HTMLElement>(
        '[data-name="component.input.checkbox"]'
      );
      if (row?.dataset.checkboxChecked !== "true") return;
      const label =
        item.querySelector<HTMLElement>('[data-name="Label"] p')?.textContent?.trim() ??
        item.querySelector("p")?.textContent?.trim();
      if (label && !/^\d+$/.test(label)) labels.push(label);
    });
  return labels;
}

function readSearchQuery(section: HTMLElement | null): string {
  if (!section) return "";
  const input = section.querySelector<HTMLInputElement>(".proto-search-input");
  return (input?.value ?? "").trim();
}

export function isByTypeFilterRadio(radioRow: HTMLElement): boolean {
  const list = findByTypeFilterList();
  if (!list) return false;
  return list.contains(radioRow);
}

export function isPlpFilterPanelTarget(target: HTMLElement): boolean {
  return !!target.closest(PLP_FILTERS_SELECTOR);
}

export function getPlpByTypeMode(root: ParentNode = document): "jabs" | "bundles" {
  const list = findByTypeFilterList(root);
  if (!list) return "jabs";

  for (const row of list.querySelectorAll<HTMLElement>(
    '[data-name="component.input.radio"]'
  )) {
    if (/^bundles$/i.test(radioLabel(row)) && row.dataset.radioChecked === "true") {
      return "bundles";
    }
  }
  return "jabs";
}

function readActivePlpFilters(root: ParentNode = document): ActivePlpFilters {
  const ageSection = findFilterSection(root, /by age/i);
  const diseaseSection = findFilterSection(root, /by disease/i);
  const regionSection = findFilterSection(root, /by region/i);
  const countrySection = findFilterSection(root, /by country/i);

  let ages: string[] | null = null;
  if (ageSection) {
    const allAgesSelected = Array.from(
      ageSection.querySelectorAll<HTMLElement>('[data-name="component.input.radio"]')
    ).some(
      (row) =>
        /all age groups/i.test(radioLabel(row)) &&
        row.dataset.radioChecked === "true"
    );
    if (!allAgesSelected) {
      const checked = readCheckedCheckboxLabels(ageSection);
      ages = checked.length ? checked : null;
    }
  }

  return {
    showBundles: getPlpByTypeMode(root) === "bundles",
    ages,
    diseases: diseaseSection ? readCheckedCheckboxLabels(diseaseSection) : [],
    regions: regionSection ? readCheckedCheckboxLabels(regionSection) : [],
    countries: countrySection ? readCheckedCheckboxLabels(countrySection) : [],
  };
}

function getFilterCheckboxItemLabel(item: HTMLElement): string {
  const fromLabel = item
    .querySelector<HTMLElement>('[data-name="Label"] p')
    ?.textContent?.trim();
  if (fromLabel) return fromLabel;

  for (const p of item.querySelectorAll<HTMLParagraphElement>("p")) {
    const text = (p.textContent ?? "").trim();
    if (text && !/^\d+$/.test(text)) return text;
  }
  return "";
}

function syncFilterSectionListSearch(section: HTMLElement | null): void {
  if (!section) return;

  const query = readSearchQuery(section).toLowerCase();
  const list = section.querySelector<HTMLElement>('[data-name="list"]');
  if (!list) return;

  list
    .querySelectorAll<HTMLElement>('[data-name="component.plp.filter.checkbox.item"]')
    .forEach((item) => {
      const label = getFilterCheckboxItemLabel(item).toLowerCase();
      const show = !query || label.includes(query);
      item.style.display = show ? "" : "none";
    });
}

/** Narrow By Disease / By Country checkbox lists from sidebar search fields only. */
export function syncPlpFilterListSearch(root: ParentNode = document): void {
  syncFilterSectionListSearch(findFilterSection(root, /by disease/i));
  syncFilterSectionListSearch(findFilterSection(root, /by country/i));
  syncPlpListingResults(root);
}

function syncPlpListingResults(root: ParentNode = document): void {
  const screen = root.querySelector<HTMLElement>(PLP_SCREEN_SELECTOR);
  if (!screen) return;

  const jabTiles = Array.from(
    screen.querySelectorAll<HTMLElement>(PLP_TILE_SELECTOR)
  ).filter((tile) => tile.dataset.protoPlpBundle !== "true");

  if (!jabTiles.length) return;

  jabTiles.forEach((tile) => {
    tile.dataset.protoPlpJab = "true";
  });

  const container = jabTiles[0].parentElement;
  if (!container) return;

  const bundleTiles = ensureBundleTiles(container, jabTiles[0]);
  const filters = readActivePlpFilters(root);
  let visibleCount = 0;

  if (filters.showBundles) {
    jabTiles.forEach((tile) => {
      tile.style.display = "none";
    });
    bundleTiles.forEach((tile, index) => {
      const item = PLP_BUNDLE_ITEMS[index];
      const show = item ? bundleItemMatches(item, filters) : false;
      tile.style.display = show ? "" : "none";
      if (show) visibleCount += 1;
    });
  } else {
    bundleTiles.forEach((tile) => {
      tile.style.display = "none";
    });
    jabTiles.forEach((tile, index) => {
      const show = jabTileMatches(tile, filters, index);
      tile.style.display = show ? "" : "none";
      if (show) visibleCount += 1;
    });
  }

  updateResultsCount(root, visibleCount);
}

/** Sync PLP listing visibility with all sidebar filters (prototype mapping). */
export function syncPlpListingFilters(root: ParentNode = document): void {
  syncPlpFilterListSearch(root);
}

function findTitleEl(tile: HTMLElement): HTMLParagraphElement | null {
  return (
    Array.from(tile.querySelectorAll<HTMLParagraphElement>("p")).find((p) =>
      /leading-\[38px\].*text-\[24px\]|text-\[24px\].*leading-\[38px\]/.test(
        p.className
      )
    ) ?? null
  );
}

function getTileTitle(tile: HTMLElement): string {
  return (findTitleEl(tile)?.textContent ?? tile.textContent ?? "").trim();
}

function getTileSearchText(tile: HTMLElement): string {
  return (tile.textContent ?? "").replace(/\s+/g, " ").trim().toLowerCase();
}

function inferTileMeta(title: string, index: number): TileFilterMeta {
  const t = title.toLowerCase();
  const diseases: string[] = [];
  if (/chickenpox|varicella/.test(t)) diseases.push("Chickenpox");
  if (/covid/.test(t)) diseases.push("COVID-19");
  if (/diphtheria|tetanus|polio|pertussis/.test(t)) diseases.push("Diphtheria");
  if (/cholera/.test(t)) diseases.push("Cholera");
  if (/dengue/.test(t)) diseases.push("Dengue");

  const ages: string[] = ["Teens & adults 13–64 years"];
  if (/chickenpox|mmr|meningococcal/.test(t)) {
    ages.push("Infants under 1 year", "Children 2–12 years");
  }
  if (index % 7 === 0) ages.push("Infants under 1 year");
  if (index % 3 === 0) ages.push("Children 2–12 years");
  if (/shingles|pneumococcal|flu|influenza/.test(t) || index % 5 === 0) {
    ages.push("Adults 65+");
  }

  const regions = new Set<string>(["Europe"]);
  if (/typhoid|hepatitis|yellow|japanese|cholera|dengue|rabies|meningococcal/.test(t)) {
    regions.add("South-East Asia");
    regions.add("Africa");
    regions.add("Americas");
    regions.add("Western Pacific");
  }
  if (/meningococcal/.test(t)) regions.add("Eastern Mediterranean");

  const countries = new Set<string>();
  if (regions.has("South-East Asia") || /japanese|dengue|typhoid|hepatitis/.test(t)) {
    countries.add("Thailand");
    countries.add("Malaysia");
    countries.add("Indonesia");
    countries.add("Philippines");
  }
  if (/yellow|rabies/.test(t)) {
    countries.add("Thailand");
    countries.add("Malaysia");
  }

  return {
    ages: [...new Set(ages)],
    diseases: [...new Set(diseases)],
    regions: [...regions],
    countries: [...countries],
  };
}

function ensureTileMeta(tile: HTMLElement, index: number): TileFilterMeta {
  if (tile.dataset.protoFilterMeta) {
    try {
      return JSON.parse(tile.dataset.protoFilterMeta) as TileFilterMeta;
    } catch {
      /* re-tag below */
    }
  }
  const meta = inferTileMeta(getTileTitle(tile), index);
  tile.dataset.protoFilterMeta = JSON.stringify(meta);
  return meta;
}

function matchesAnySelected(selected: string[], tags: string[], haystack: string): boolean {
  if (!selected.length) return true;
  const blob = `${tags.join(" ")} ${haystack}`.toLowerCase();
  return selected.some((value) => blob.includes(value.toLowerCase()));
}

function jabTileMatches(tile: HTMLElement, filters: ActivePlpFilters, index: number): boolean {
  const meta = ensureTileMeta(tile, index);
  const haystack = getTileSearchText(tile);

  if (filters.ages && !matchesAnySelected(filters.ages, meta.ages, haystack)) {
    return false;
  }
  if (!matchesAnySelected(filters.diseases, meta.diseases, haystack)) return false;
  if (!matchesAnySelected(filters.regions, meta.regions, haystack)) return false;
  if (!matchesAnySelected(filters.countries, meta.countries, haystack)) return false;
  return true;
}

function bundleItemMatches(item: PlpBundleItem, filters: ActivePlpFilters): boolean {
  const haystack = `${item.title} ${item.subtitle} ${item.description}`.toLowerCase();

  if (!matchesAnySelected(filters.diseases, [], haystack)) return false;
  if (!matchesAnySelected(filters.regions, item.regions, haystack)) return false;
  if (!matchesAnySelected(filters.countries, item.countries, haystack)) return false;
  return true;
}

function setTilePriceLabel(tile: HTMLElement, label: string): void {
  Array.from(tile.querySelectorAll<HTMLParagraphElement>("p")).forEach((p) => {
    if (/price for 1 dose|bundle price/i.test(p.textContent ?? "")) {
      p.textContent = label;
    }
  });
}

function setTilePriceAmount(tile: HTMLElement, amount: string): void {
  const priceRoot = tile.querySelector('[data-name="component.product.price"]');
  const amountEl = priceRoot?.querySelectorAll("p")[1];
  if (amountEl) amountEl.textContent = amount;
}

function findSubtitleEl(tile: HTMLElement): HTMLParagraphElement | null {
  return (
    Array.from(tile.querySelectorAll<HTMLParagraphElement>("p")).find((p) =>
      /text-\[#7a7d87\]/.test(p.className)
    ) ?? null
  );
}

function findDescriptionEl(tile: HTMLElement): HTMLParagraphElement | null {
  return (
    Array.from(tile.querySelectorAll<HTMLParagraphElement>("p")).find((p) => {
      const text = (p.textContent ?? "").trim();
      return (
        text.length > 48 &&
        /text-\[13px\]/.test(p.className) &&
        /text-\[#3a3a3a\]/.test(p.className)
      );
    }) ?? null
  );
}

function findSavingsEl(tile: HTMLElement): HTMLParagraphElement | null {
  return (
    Array.from(tile.querySelectorAll<HTMLParagraphElement>("p")).find((p) =>
      /text-\[#459827\]/.test(p.className)
    ) ?? null
  );
}

function applyBundleToTile(tile: HTMLElement, bundle: PlpBundleItem): void {
  findTitleEl(tile)?.replaceChildren(document.createTextNode(bundle.title));
  findSubtitleEl(tile)?.replaceChildren(document.createTextNode(bundle.subtitle));
  findDescriptionEl(tile)?.replaceChildren(
    document.createTextNode(bundle.description)
  );
  findSavingsEl(tile)?.replaceChildren(document.createTextNode(bundle.savings));
  setTilePriceLabel(tile, "Bundle price");
  setTilePriceAmount(tile, bundle.price);
}

function ensureBundleTiles(
  container: HTMLElement,
  template: HTMLElement
): HTMLElement[] {
  const existing = Array.from(
    container.querySelectorAll<HTMLElement>('[data-proto-plp-bundle="true"]')
  );
  if (existing.length >= PLP_BUNDLE_ITEMS.length) {
    existing.forEach((tile, index) => {
      if (index < PLP_BUNDLE_ITEMS.length) {
        applyBundleToTile(tile, PLP_BUNDLE_ITEMS[index]);
      }
    });
    return existing.slice(0, PLP_BUNDLE_ITEMS.length);
  }

  const created: HTMLElement[] = [];
  PLP_BUNDLE_ITEMS.forEach((bundle) => {
    const tile = template.cloneNode(true) as HTMLElement;
    tile.dataset.protoPlpBundle = "true";
    tile.removeAttribute("data-proto-plp-jab");
    tile.removeAttribute("data-proto-filter-meta");
    tile.style.display = "none";
    applyBundleToTile(tile, bundle);
    container.appendChild(tile);
    created.push(tile);
  });
  return created;
}

function selectRadioInSection(section: HTMLElement | null, labelPattern: RegExp): void {
  if (!section) return;

  const list =
    section.querySelector<HTMLElement>('[data-name="list"]') ?? section;
  const radios = list.querySelectorAll<HTMLElement>(
    '[data-name="component.input.radio"]'
  );
  if (!radios.length) return;

  radios.forEach((row) => {
    row.dataset.radioChecked = "false";
  });

  const match = Array.from(radios).find((row) =>
    labelPattern.test(radioLabel(row))
  );
  if (match) {
    match.dataset.radioChecked = "true";
    list
      .querySelectorAll<HTMLElement>('[data-name="component.input.checkbox"]')
      .forEach((row) => {
        row.dataset.checkboxChecked = "false";
      });
  }
}

function clearPlpFilterSearchFields(root: ParentNode): void {
  const module = root.querySelector(PLP_FILTERS_SELECTOR);
  if (!module) return;

  module.querySelectorAll<HTMLInputElement>(".proto-search-input").forEach((input) => {
    input.value = "";
    const textField = input.closest<HTMLElement>('[data-name="Text Field"]');
    if (!textField) return;

    textField.dataset.protoSearchFilled = "false";
    const clearBtn = textField.querySelector<HTMLButtonElement>(
      ".proto-plp-search-clear"
    );
    if (clearBtn) {
      clearBtn.hidden = true;
      clearBtn.style.display = "none";
      clearBtn.tabIndex = -1;
      clearBtn.setAttribute("aria-hidden", "true");
    }
  });
}

function ensurePlpResetFiltersCta(
  controls: HTMLElement,
  root: ParentNode
): HTMLButtonElement {
  let button = controls.querySelector<HTMLButtonElement>(
    '[data-proto-plp-reset-filters="true"]'
  );

  if (!button) {
    controls.classList.add("proto-plp-filter-controls");

    button = document.createElement("button");
    button.type = "button";
    button.dataset.protoPlpResetFilters = "true";
    button.setAttribute("data-name", "component.input.button");
    button.className =
      "bg-[#012169] content-stretch flex gap-[8px] h-[48px] items-center justify-center px-[24px] py-[12px] relative rounded-[360px] shrink-0 border-0 cursor-pointer";
    button.innerHTML = `<div class="[text-box-edge:cap_alphabetic] [text-box-trim:trim-both] [word-break:break-word] flex flex-col font-['Open_Sans:SemiBold',sans-serif] font-semibold justify-center leading-[0] relative shrink-0 text-[16px] text-center text-white tracking-[-0.32px] whitespace-nowrap" style="font-variation-settings: 'wdth' 100"><p class="leading-[16px]">Reset Filters</p></div>`;
    button.addEventListener("click", () => resetPlpFilters(root));
    controls.appendChild(button);
  }

  return button;
}

/** Reset PLP sidebar filters to defaults and refresh the listing. */
export function resetPlpFilters(root: ParentNode = document): void {
  const module = root.querySelector(PLP_FILTERS_SELECTOR);
  if (!module) return;

  module
    .querySelectorAll<HTMLElement>('[data-name="component.input.checkbox"]')
    .forEach((row) => {
      row.dataset.checkboxChecked = "false";
    });

  selectRadioInSection(findFilterSection(root, /by type/i), /^individual jabs$/i);
  selectRadioInSection(findFilterSection(root, /by age/i), /all age groups/i);
  clearPlpFilterSearchFields(root);
  syncPlpFilterListSearch(root);
  syncPlpListingFilters(root);
}

function updateResultsCount(root: ParentNode, visible: number): void {
  const controls = root.querySelector<HTMLElement>(
    '[data-name="component.filter.controls"]'
  );
  if (!controls) return;

  const el = controls.querySelector("p");
  if (el) {
    const noun = visible === 1 ? "service" : "services";
    el.textContent = `${visible} ${noun} available for the selected filters`;
  }

  const resetBtn = ensurePlpResetFiltersCta(controls, root);
  const showReset = visible === 0;
  resetBtn.hidden = !showReset;
  resetBtn.style.display = showReset ? "" : "none";
}

/** @deprecated Use syncPlpListingFilters */
export function syncPlpListingTypeFilter(root: ParentNode = document): void {
  syncPlpListingFilters(root);
}
