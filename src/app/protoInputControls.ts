export const PROTO_CHECKMARK_HTML = `<div class="absolute inset-0 flex items-center justify-center" data-name="element. gse. checkbox. check mark"><svg width="14" height="10" viewBox="0 0 13.4079 10.1151" fill="none"><path clip-rule="evenodd" d="M0 5.49077L1.40162 4.06407L4.69457 7.29914L11.9937 0L13.4079 1.41421L4.70705 10.1151L0 5.49077Z" fill="#305854" fill-rule="evenodd"/></svg></div>`;

export const PROTO_RADIO_DOT_HTML = `<div class="absolute inset-0 flex items-center justify-center" data-name="element. gse. radio. circle"><svg width="10" height="10" viewBox="0 0 10 10" fill="none"><circle cx="5" cy="5" r="5" fill="#305854"/></svg></div>`;

export function isBoxCheckedFromFigma(box: HTMLElement): boolean {
  return (
    box.className.includes("bg-[#afccca]") ||
    box.className.includes("bg-[#c6e5e1]")
  );
}

export function isBoosterCheckboxRow(row: HTMLElement): boolean {
  return row.dataset.protoBooster === "true";
}

export function markBoosterCheckboxRow(row: HTMLElement): void {
  row.dataset.protoBooster = "true";
}

function standardizeCheckboxBox(box: HTMLElement): void {
  box.className = "absolute left-0 top-0 size-[24px] rounded-[2px]";
  box.replaceChildren();
  box.insertAdjacentHTML("beforeend", PROTO_CHECKMARK_HTML);
  box.dataset.protoStandardized = "1";
}

function standardizeRadioBox(box: HTMLElement): void {
  box.className = "absolute left-0 top-0 size-[24px] rounded-[360px]";
  box.replaceChildren();
  box.insertAdjacentHTML("beforeend", PROTO_RADIO_DOT_HTML);
  box.dataset.protoStandardized = "1";
}

function findCheckboxRow(target: HTMLElement): HTMLElement | null {
  const direct = target.closest<HTMLElement>(
    '[data-name="component.input.checkbox"]'
  );
  if (direct) return direct;

  const filterItem = target.closest<HTMLElement>(
    '[data-name="component.plp.filter.checkbox.item"]'
  );
  return (
    filterItem?.querySelector<HTMLElement>(
      '[data-name="component.input.checkbox"]'
    ) ?? null
  );
}

export function ensureCheckboxRow(row: HTMLElement): void {
  const box = row.querySelector<HTMLElement>('[data-name="box"]');
  if (!box) return;

  if (box.dataset.protoStandardized !== "1") {
    if (row.dataset.checkboxChecked === undefined && !isBoosterCheckboxRow(row)) {
      row.dataset.checkboxChecked = String(isBoxCheckedFromFigma(box));
    }
    standardizeCheckboxBox(box);
  }

  row.style.cursor = "pointer";
}

export function ensureRadioRow(row: HTMLElement): void {
  const box = row.querySelector<HTMLElement>('[data-name="box"]');
  if (!box) return;

  if (box.dataset.protoStandardized !== "1") {
    if (row.dataset.radioChecked === undefined) {
      row.dataset.radioChecked = String(isBoxCheckedFromFigma(box));
    }
    standardizeRadioBox(box);
  }

  row.style.cursor = "pointer";
}

export function initProtoInputControls(root: ParentNode = document): void {
  root
    .querySelectorAll<HTMLElement>('[data-name="component.input.checkbox"]')
    .forEach(ensureCheckboxRow);

  root
    .querySelectorAll<HTMLElement>('[data-name="component.input.radio"]')
    .forEach(ensureRadioRow);

  root
    .querySelectorAll<HTMLElement>(
      '[data-name="component.plp.filter.checkbox.item"]'
    )
    .forEach((item) => {
      item.style.cursor = "pointer";
    });
}

export function handleProtoInputClick(target: HTMLElement): boolean {
  const checkboxRow = findCheckboxRow(target);
  if (checkboxRow) {
    if (isBoosterCheckboxRow(checkboxRow)) return false;

    ensureCheckboxRow(checkboxRow);
    const wasChecked = checkboxRow.dataset.checkboxChecked === "true";
    checkboxRow.dataset.checkboxChecked = String(!wasChecked);
    return true;
  }

  const radioRow = target.closest<HTMLElement>(
    '[data-name="component.input.radio"]'
  );
  if (!radioRow) return false;

  ensureRadioRow(radioRow);

  const list = radioRow.closest<HTMLElement>('[data-name="list"]');
  if (list) {
    list
      .querySelectorAll<HTMLElement>('[data-name="component.input.radio"]')
      .forEach((row) => {
        ensureRadioRow(row);
        row.dataset.radioChecked = "false";
      });
  }

  radioRow.dataset.radioChecked = "true";
  return true;
}
