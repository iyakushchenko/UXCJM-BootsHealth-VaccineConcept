/**
 * Synthetic pointer events do not flip CSS `:hover` / `:active`.
 * Bridge those selectors onto demo classes used by the robo-cursor path:
 *   :hover  → .proto-chat-cta--hover
 *   :active → .proto-chat-cta--pressed
 *
 * Installed with fingerprint refresh (idempotent when sheets unchanged).
 * Skips negative :not(:hover/:active) compounds and pseudo-element states
 * (`::-webkit-scrollbar-thumb:hover` cannot take a class).
 *
 * HARD hang guard: cap bridged rule count + skip vendor sheets + insertRule
 * per rule (invalid transforms must not abort the rest of the bridge sheet).
 *
 * P0 (v0.0.34): never split selector lists on commas inside :is()/:not()/:has()
 * — naive split emitted broken selectors that stalled CSSOM parse so later
 * page rules (e.g. `.pdp__secondary:hover`) never applied under robo.
 */

export const DEMO_HOVER_CLASS = "proto-chat-cta--hover";
export const DEMO_PRESSED_CLASS = "proto-chat-cta--pressed";

/** Observable mirror attribute — same lifetime as DEMO_HOVER_CLASS. */
export const DEMO_ROBO_HOVER_ATTR = "data-studio-robo-hover";

const BRIDGE_STYLE_ID = "studio-demo-pseudo-bridge";

/** Cap prevents mega stylesheets from thrashing Chrome on class toggle. */
export const DEMO_PSEUDO_BRIDGE_MAX_RULES = 256;

const VENDOR_SHEET_RE =
  /node_modules|framer-motion|@emotion|react-day-picker|lucide|vite\/client/i;
const APP_SHEET_HINT_RE =
  /proto-|uxds-|studio-|boots|globals|accordion|pdp|plp|avail/i;

/**
 * Split a selector list on top-level commas only.
 * Commas inside :is()/:not()/:where()/:has() / [] must stay intact.
 */
export function splitSelectorsTopLevel(selectorText: string): string[] {
  const parts: string[] = [];
  let depthParen = 0;
  let depthBracket = 0;
  let begin = 0;
  let quote: '"' | "'" | null = null;

  for (let i = 0; i < selectorText.length; i++) {
    const ch = selectorText[i];
    if (quote) {
      if (ch === quote && selectorText[i - 1] !== "\\") quote = null;
      continue;
    }
    if (ch === '"' || ch === "'") {
      quote = ch;
      continue;
    }
    if (ch === "(") depthParen += 1;
    else if (ch === ")") depthParen = Math.max(0, depthParen - 1);
    else if (ch === "[") depthBracket += 1;
    else if (ch === "]") depthBracket = Math.max(0, depthBracket - 1);
    else if (ch === "," && depthParen === 0 && depthBracket === 0) {
      const piece = selectorText.slice(begin, i).trim();
      if (piece) parts.push(piece);
      begin = i + 1;
    }
  }
  const tail = selectorText.slice(begin).trim();
  if (tail) parts.push(tail);
  return parts;
}

function isBalancedSelector(sel: string): boolean {
  let paren = 0;
  let bracket = 0;
  let quote: '"' | "'" | null = null;
  for (let i = 0; i < sel.length; i++) {
    const ch = sel[i];
    if (quote) {
      if (ch === quote && sel[i - 1] !== "\\") quote = null;
      continue;
    }
    if (ch === '"' || ch === "'") {
      quote = ch;
      continue;
    }
    if (ch === "(") paren += 1;
    else if (ch === ")") paren -= 1;
    else if (ch === "[") bracket += 1;
    else if (ch === "]") bracket -= 1;
    if (paren < 0 || bracket < 0) return false;
  }
  return paren === 0 && bracket === 0;
}

/** Class cannot attach to a pseudo-element (`::thumb:hover` → invalid). */
function targetsPseudoElementState(
  part: string,
  state: "hover" | "active"
): boolean {
  return new RegExp(`::[\\w-].*:${state}\\b`).test(part);
}

/** Pure selector transform — exported for unit tests. */
export function bridgeDemoPseudoSelector(selectorText: string): string | null {
  const extras: string[] = [];

  for (const part of splitSelectorsTopLevel(selectorText)) {
    if (
      /:hover\b/.test(part) &&
      !part.includes(DEMO_HOVER_CLASS) &&
      !/:not\(\s*:hover\b/.test(part) &&
      !targetsPseudoElementState(part, "hover")
    ) {
      const bridged = part.replace(/:hover\b/g, `.${DEMO_HOVER_CLASS}`);
      if (isBalancedSelector(bridged)) extras.push(bridged);
    }

    if (
      /:active\b/.test(part) &&
      !part.includes(DEMO_PRESSED_CLASS) &&
      !/:not\(\s*:active\b/.test(part) &&
      !targetsPseudoElementState(part, "active")
    ) {
      const bridged = part.replace(/:active\b/g, `.${DEMO_PRESSED_CLASS}`);
      if (isBalancedSelector(bridged)) extras.push(bridged);
    }
  }

  if (extras.length === 0) return null;
  return extras.join(", ");
}

function sheetIdentity(sheet: CSSStyleSheet): string {
  const owner = sheet.ownerNode as HTMLElement | null;
  if (owner?.id) return owner.id;
  if (owner?.getAttribute?.("data-vite-dev-id")) {
    return owner.getAttribute("data-vite-dev-id") ?? "";
  }
  if (typeof sheet.href === "string" && sheet.href) return sheet.href;
  if (owner?.textContent) {
    return owner.textContent.slice(0, 120);
  }
  return "";
}

/** Prefer Studio/UXDS/Boots sheets; skip known vendor bundles. */
export function shouldBridgeStyleSheet(sheet: CSSStyleSheet): boolean {
  const id = sheetIdentity(sheet);
  if (!id) {
    // Inline anonymous — allow but collectBridged will still cap.
    return true;
  }
  if (VENDOR_SHEET_RE.test(id)) return false;
  if (APP_SHEET_HINT_RE.test(id)) return true;
  // Unknown readable sheet: allow until cap (tests inject probe sheets).
  return true;
}

/** Lower = collected first under the 256 cap (page/DS before chrome flood). */
function sheetPriority(sheet: CSSStyleSheet): number {
  const id = sheetIdentity(sheet);
  if (/[\\/](pdp|plp|avail)[\\/]|\.pdp\.|\.plp\.|uxds/i.test(id)) return 0;
  if (/boots|accordion|book-step/i.test(id)) return 1;
  if (/studio-|globals|proto-/i.test(id)) return 2;
  return 3;
}

function computeBridgeFingerprint(): string {
  const bits: string[] = [];
  for (const sheet of Array.from(document.styleSheets)) {
    if ((sheet.ownerNode as HTMLElement | null)?.id === BRIDGE_STYLE_ID) continue;
    if (!shouldBridgeStyleSheet(sheet)) continue;
    try {
      bits.push(`${sheetIdentity(sheet)}:${sheet.cssRules.length}`);
    } catch {
      bits.push(`${sheetIdentity(sheet)}:x`);
    }
  }
  return bits.join("|");
}

function tryInsertRule(sheet: CSSStyleSheet, cssText: string): boolean {
  try {
    sheet.insertRule(cssText, sheet.cssRules.length);
    return true;
  } catch {
    return false;
  }
}

function insertBridgedFromRuleList(
  ruleList: CSSRuleList,
  target: CSSStyleSheet,
  budget: { remaining: number }
): void {
  for (let i = 0; i < ruleList.length; i++) {
    if (budget.remaining <= 0) return;
    const rule = ruleList[i];

    if (rule instanceof CSSStyleRule) {
      const bridged = bridgeDemoPseudoSelector(rule.selectorText);
      if (!bridged) continue;
      if (tryInsertRule(target, `${bridged}{${rule.style.cssText}}`)) {
        budget.remaining -= 1;
      }
      continue;
    }

    if (rule instanceof CSSMediaRule) {
      const nested = collectBridgedStyleChunks(rule.cssRules, budget.remaining);
      if (
        nested.chunks.length > 0 &&
        tryInsertRule(
          target,
          `@media ${rule.conditionText}{${nested.chunks.join("")}}`
        )
      ) {
        budget.remaining -= nested.count;
      }
      continue;
    }

    if (rule instanceof CSSSupportsRule) {
      const nested = collectBridgedStyleChunks(rule.cssRules, budget.remaining);
      if (
        nested.chunks.length > 0 &&
        tryInsertRule(
          target,
          `@supports ${rule.conditionText}{${nested.chunks.join("")}}`
        )
      ) {
        budget.remaining -= nested.count;
      }
    }
  }
}

/** Flat style-rule chunks only (for wrapping in @media / @supports). */
function collectBridgedStyleChunks(
  ruleList: CSSRuleList,
  remaining: number
): { chunks: string[]; count: number } {
  const chunks: string[] = [];
  let count = 0;
  for (let i = 0; i < ruleList.length && count < remaining; i++) {
    const rule = ruleList[i];
    if (!(rule instanceof CSSStyleRule)) continue;
    const bridged = bridgeDemoPseudoSelector(rule.selectorText);
    if (!bridged) continue;
    chunks.push(`${bridged}{${rule.style.cssText}}`);
    count += 1;
  }
  return { chunks, count };
}

/** Build + inject the bridge stylesheet. Safe to call repeatedly. */
export function ensureDemoPseudoBridge(options?: { force?: boolean }): void {
  if (typeof document === "undefined") return;

  const fingerprint = computeBridgeFingerprint();
  const existing = document.getElementById(BRIDGE_STYLE_ID);
  if (
    existing &&
    !options?.force &&
    existing.getAttribute("data-studio-bridge-fp") === fingerprint
  ) {
    return;
  }
  existing?.remove();

  const style = document.createElement("style");
  style.id = BRIDGE_STYLE_ID;
  style.setAttribute("data-studio", "demo-pseudo-bridge");
  document.head.appendChild(style);
  const target = style.sheet;
  if (!target) return;

  const budget = { remaining: DEMO_PSEUDO_BRIDGE_MAX_RULES };
  const sheets = Array.from(document.styleSheets)
    .filter((sheet) => {
      if ((sheet.ownerNode as HTMLElement | null)?.id === BRIDGE_STYLE_ID) {
        return false;
      }
      return shouldBridgeStyleSheet(sheet);
    })
    .sort((a, b) => sheetPriority(a) - sheetPriority(b));

  for (const sheet of sheets) {
    if (budget.remaining <= 0) break;
    try {
      insertBridgedFromRuleList(sheet.cssRules, target, budget);
    } catch {
      // Cross-origin / unreadable sheets — skip.
    }
  }

  const inserted = DEMO_PSEUDO_BRIDGE_MAX_RULES - budget.remaining;
  style.setAttribute("data-studio-bridge-rules", String(inserted));
  style.setAttribute("data-studio-bridge-fp", fingerprint);
  style.setAttribute(
    "data-studio-bridge-cssom",
    String(target.cssRules.length)
  );
}

/** Test / teardown helper. */
export function removeDemoPseudoBridge(): void {
  document.getElementById(BRIDGE_STYLE_ID)?.remove();
}
