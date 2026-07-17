import { PROTO_CLOSE_ICON_HTML } from "@/app/ProtoCloseIcon";

/** Shared copy + counts for Availability Tool and Locations popup. */
export const PROTO_LOC_SEARCH_DEFAULT = "London";
export const PROTO_LOC_SEARCH_NEAR = "Search for City, Postcode, Location...";
export const PROTO_LOC_COUNT_DEFAULT = "13 locations found";
export const PROTO_LOC_COUNT_NEAR = "63 locations found (in 10km radius)";

const FOUND_DOT_FLASH_MS = 900;

const FIGMA_SEARCH_PLACEHOLDER_RE =
  /^(search disease|search for city|enter city|post code|location\.\.\.)$/i;

/** True when a location/search field has no user-entered value. */
export function isLocationSearchQueryEmpty(query: string): boolean {
  return query.trim() === "";
}

/** Show the in-field clear (X) only when the search has a value. */
export function shouldShowLocationSearchClear(query: string): boolean {
  return !isLocationSearchQueryEmpty(query);
}

export function syncLocationSearchClearBtn(
  clearBtn: HTMLElement | null | undefined,
  query: string
): void {
  if (!clearBtn) return;
  const show = shouldShowLocationSearchClear(query);
  clearBtn.hidden = !show;
  clearBtn.style.display = show ? "" : "none";
  clearBtn.tabIndex = show ? 0 : -1;
  clearBtn.setAttribute("aria-hidden", show ? "false" : "true");
}

function readFigmaTextFieldValue(textField: HTMLElement): string {
  const input = textField.querySelector<HTMLInputElement>("input");
  if (input) return input.value.trim();
  const label = textField.querySelector<HTMLElement>(
    "[data-name='wrapper'] p, [data-name='Label'] p"
  );
  return (label?.textContent ?? "").trim();
}

function isFigmaSearchFieldEmpty(textField: HTMLElement): boolean {
  const text = readFigmaTextFieldValue(textField);
  if (!text) return true;
  if (text === PROTO_LOC_SEARCH_NEAR) return true;
  if (FIGMA_SEARCH_PLACEHOLDER_RE.test(text)) return true;
  if (/^search for city/i.test(text)) return true;
  if (/^enter city/i.test(text)) return true;
  return false;
}

/** Hide baked-in Figma `icon=clear` when the static search label is empty/placeholder. */
export function syncFigmaSearchClearIcons(root: ParentNode = document): void {
  root.querySelectorAll<HTMLElement>('[data-name="Text Field"]').forEach((tf) => {
    const clear = tf.querySelector<HTMLElement>('[data-name="icon=clear"]');
    if (!clear) return;
    const empty = isFigmaSearchFieldEmpty(tf);
    clear.hidden = empty;
    clear.style.display = empty ? "none" : "";
    tf.dataset.protoSearchFilled = empty ? "false" : "true";
  });
}

export type LocationSearchView = {
  step: "list" | "map";
  nearMe: boolean;
};

export function isListSearchView(view: LocationSearchView): boolean {
  return view.step === "list" && !view.nearMe;
}

export function isNearMeMapView(view: LocationSearchView): boolean {
  return view.step === "map" && view.nearMe;
}

export function dismissLocationFieldFocus(from: HTMLElement) {
  from.blur();
  const field =
    from.closest("[data-name='component.input.field']") ??
    from.closest(".proto-avail-field");
  field?.querySelector<HTMLInputElement>("input")?.blur();
  if (field instanceof HTMLElement) field.blur();
}

/** Brief primary-dot flash beside the “locations found” line (DOM popups). */
export function createFoundCountDotFlasher() {
  let timer: number | undefined;

  const ensureDot = (countLabel: HTMLElement | null): HTMLElement | null => {
    if (!countLabel) return null;
    let wrap = countLabel.closest<HTMLElement>(".proto-avail-found-wrap");
    if (!wrap) {
      wrap = document.createElement("div");
      wrap.className = "proto-avail-found-wrap";
      const parent = countLabel.parentElement;
      if (!parent) return null;
      parent.insertBefore(wrap, countLabel);
      wrap.appendChild(countLabel);
    }
    let dot = wrap.querySelector<HTMLElement>(".proto-avail-found-dot");
    if (!dot) {
      dot = document.createElement("span");
      dot.className = "proto-avail-found-dot";
      dot.setAttribute("aria-hidden", "true");
      dot.hidden = true;
      wrap.appendChild(dot);
    }
    return dot;
  };

  const flash = (countLabel: HTMLElement | null) => {
    const dot = ensureDot(countLabel);
    if (!dot) return;
    dot.hidden = false;
    dot.classList.remove("proto-avail-found-dot--flash");
    void dot.offsetWidth;
    dot.classList.add("proto-avail-found-dot--flash");
    if (timer != null) window.clearTimeout(timer);
    timer = window.setTimeout(() => {
      dot.classList.remove("proto-avail-found-dot--flash");
      dot.hidden = true;
      timer = undefined;
    }, FOUND_DOT_FLASH_MS);
  };

  const cleanup = () => {
    if (timer != null) window.clearTimeout(timer);
    timer = undefined;
    document
      .querySelectorAll<HTMLElement>(".proto-avail-found-dot--flash")
      .forEach((dot) => {
        dot.classList.remove("proto-avail-found-dot--flash");
        dot.hidden = true;
      });
  };

  return { flash, cleanup, ensureDot };
}

type WirePopupSearchChromeOpts = {
  searchField: HTMLElement;
  countLabel: HTMLElement | null;
  getView: () => LocationSearchView;
  onResetToList: () => void;
  onOpenNearMeMap: () => void;
  flashCount: (countLabel: HTMLElement | null) => void;
  viewCleanups: (() => void)[];
};

/**
 * Locations popup — same search chrome as Availability Tool:
 * clear (X) + search icon, repeat-click dot flash, focus dismiss.
 */
export function wirePopupLocationSearchChrome(opts: WirePopupSearchChromeOpts) {
  const {
    searchField,
    countLabel,
    getView,
    onResetToList,
    onOpenNearMeMap,
    flashCount,
    viewCleanups,
  } = opts;

  searchField.classList.add("proto-lb-search-field");

  const textField =
    searchField.querySelector<HTMLElement>('[data-name="Text Field"]') ??
    searchField;
  const row =
    textField.querySelector<HTMLElement>(
      ":scope > div > div.content-stretch"
    ) ?? textField.querySelector<HTMLElement>(".content-stretch");
  const searchIconHost = row?.querySelector<HTMLElement>(
    '[data-name="icon=search"]'
  );

  const onClear = (e: Event) => {
    e.preventDefault();
    e.stopPropagation();
    dismissLocationFieldFocus(e.currentTarget as HTMLElement);
    onResetToList();
  };

  const onSearchIcon = (e: Event) => {
    e.preventDefault();
    e.stopPropagation();
    const view = getView();
    if (isListSearchView(view)) {
      dismissLocationFieldFocus(e.currentTarget as HTMLElement);
      flashCount(countLabel);
      return;
    }
    if (view.nearMe || view.step === "map") {
      onResetToList();
    }
  };

  const onFieldClick = (e: Event) => {
    const view = getView();
    if (view.nearMe || view.step === "map") {
      e.preventDefault();
      e.stopPropagation();
      onResetToList();
    }
  };

  let clearBtn = row?.querySelector<HTMLButtonElement>(".proto-popup-close");
  if (!clearBtn && row && searchIconHost) {
    const actions = document.createElement("span");
    actions.className = "proto-avail-field__actions";

    clearBtn = document.createElement("button");
    clearBtn.type = "button";
    clearBtn.className = "proto-popup-close";
    clearBtn.setAttribute("aria-label", "Clear search");
    clearBtn.innerHTML = PROTO_CLOSE_ICON_HTML;

    const searchBtn = document.createElement("button");
    searchBtn.type = "button";
    searchBtn.className = "proto-avail-field__icon";
    searchBtn.setAttribute("aria-label", "Search");
    searchBtn.dataset.protoLbSearchIcon = "true";
    while (searchIconHost.firstChild) {
      searchBtn.appendChild(searchIconHost.firstChild);
    }
    searchIconHost.replaceWith(searchBtn);

    actions.appendChild(clearBtn);
    actions.appendChild(searchBtn);
    row.appendChild(actions);

    searchBtn.addEventListener("click", onSearchIcon);
    viewCleanups.push(() => searchBtn.removeEventListener("click", onSearchIcon));
  } else if (row) {
    const searchBtn = row.querySelector<HTMLButtonElement>(
      "[data-proto-lb-search-icon='true']"
    );
    searchBtn?.addEventListener("click", onSearchIcon);
    if (searchBtn) {
      viewCleanups.push(() =>
        searchBtn.removeEventListener("click", onSearchIcon)
      );
    }
  }

  const syncClear = () => {
    const input = textField.querySelector<HTMLInputElement>("input");
    const value = input
      ? input.value
      : (textField.querySelector<HTMLElement>("[data-name='wrapper'] p")?.textContent ??
        "");
    syncLocationSearchClearBtn(clearBtn, value);
  };

  if (clearBtn) {
    clearBtn.addEventListener("click", onClear);
    viewCleanups.push(() => clearBtn!.removeEventListener("click", onClear));
  }

  syncClear();
  const input = textField.querySelector<HTMLInputElement>("input");
  if (input) {
    const onInput = () => syncClear();
    input.addEventListener("input", onInput);
    viewCleanups.push(() => input.removeEventListener("input", onInput));
  }

  searchField.style.cursor = "pointer";
  searchField.addEventListener("click", onFieldClick);
  viewCleanups.push(() =>
    searchField.removeEventListener("click", onFieldClick)
  );
}

export function wirePopupNearMeCta(
  nearMeBtn: HTMLElement,
  opts: {
    getView: () => LocationSearchView;
    onOpenNearMeMap: () => void;
    flashCount: (countLabel: HTMLElement | null) => void;
    countLabel: HTMLElement | null;
    viewCleanups: (() => void)[];
  }
) {
  nearMeBtn.classList.add("proto-tertiary-cta", "proto-tertiary-cta--compact");
  nearMeBtn.style.cursor = "pointer";

  const onNearMe = (e: Event) => {
    e.preventDefault();
    e.stopPropagation();
    const view = opts.getView();
    if (isNearMeMapView(view)) {
      (e.currentTarget as HTMLButtonElement | undefined)?.blur();
      opts.flashCount(opts.countLabel);
      return;
    }
    opts.onOpenNearMeMap();
  };

  nearMeBtn.addEventListener("click", onNearMe);
  opts.viewCleanups.push(() =>
    nearMeBtn.removeEventListener("click", onNearMe)
  );
}
