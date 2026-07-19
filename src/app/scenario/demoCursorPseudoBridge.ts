/**
 * Synthetic pointer events do not flip CSS `:hover` / `:active`.
 * Bridge those selectors onto demo classes used by the robo-cursor path:
 *   :hover  → .proto-chat-cta--hover
 *   :active → .proto-chat-cta--pressed
 *
 * Installed once (idempotent). Skips negative :not(:hover/:active) compounds.
 *
 * HARD hang guard: cap bridged rule count + skip vendor sheets. Unbounded
 * bridge CSS + class toggles caused Chrome style-recalc storms (P0 hang class).
 */

export const DEMO_HOVER_CLASS = "proto-chat-cta--hover";
export const DEMO_PRESSED_CLASS = "proto-chat-cta--pressed";

const BRIDGE_STYLE_ID = "studio-demo-pseudo-bridge";

/** Cap prevents mega stylesheets from thrashing Chrome on class toggle. */
export const DEMO_PSEUDO_BRIDGE_MAX_RULES = 256;

const VENDOR_SHEET_RE =
  /node_modules|framer-motion|@emotion|react-day-picker|lucide|vite\/client/i;
const APP_SHEET_HINT_RE =
  /proto-|uxds-|studio-|boots|globals|accordion|pdp|plp|avail/i;

/** Pure selector transform — exported for unit tests. */
export function bridgeDemoPseudoSelector(selectorText: string): string | null {
  const extras: string[] = [];
  for (const part of selectorText.split(",").map((s) => s.trim()).filter(Boolean)) {
    if (
      /:hover\b/.test(part) &&
      !part.includes(DEMO_HOVER_CLASS) &&
      !/:not\(\s*:hover\b/.test(part)
    ) {
      extras.push(part.replace(/:hover\b/g, `.${DEMO_HOVER_CLASS}`));
    }
    if (
      /:active\b/.test(part) &&
      !part.includes(DEMO_PRESSED_CLASS) &&
      !/:not\(\s*:active\b/.test(part)
    ) {
      extras.push(part.replace(/:active\b/g, `.${DEMO_PRESSED_CLASS}`));
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

function collectBridgedCssText(
  ruleList: CSSRuleList,
  out: string[],
  budget: { remaining: number }
): void {
  for (let i = 0; i < ruleList.length; i++) {
    if (budget.remaining <= 0) return;
    const rule = ruleList[i];
    if (rule instanceof CSSStyleRule) {
      const bridged = bridgeDemoPseudoSelector(rule.selectorText);
      if (bridged) {
        out.push(`${bridged}{${rule.style.cssText}}`);
        budget.remaining -= 1;
      }
      continue;
    }
    if (rule instanceof CSSMediaRule) {
      const nested: string[] = [];
      collectBridgedCssText(rule.cssRules, nested, budget);
      if (nested.length > 0) {
        out.push(`@media ${rule.conditionText}{${nested.join("")}}`);
      }
      continue;
    }
    if (rule instanceof CSSSupportsRule) {
      const nested: string[] = [];
      collectBridgedCssText(rule.cssRules, nested, budget);
      if (nested.length > 0) {
        out.push(`@supports ${rule.conditionText}{${nested.join("")}}`);
      }
    }
  }
}

/** Build + inject the bridge stylesheet. Safe to call repeatedly. */
export function ensureDemoPseudoBridge(): void {
  if (typeof document === "undefined") return;
  if (document.getElementById(BRIDGE_STYLE_ID)) return;

  const chunks: string[] = [];
  const budget = { remaining: DEMO_PSEUDO_BRIDGE_MAX_RULES };
  for (const sheet of Array.from(document.styleSheets)) {
    if (budget.remaining <= 0) break;
    if ((sheet.ownerNode as HTMLElement | null)?.id === BRIDGE_STYLE_ID) continue;
    if (!shouldBridgeStyleSheet(sheet)) continue;
    try {
      collectBridgedCssText(sheet.cssRules, chunks, budget);
    } catch {
      // Cross-origin / unreadable sheets — skip.
    }
  }

  const style = document.createElement("style");
  style.id = BRIDGE_STYLE_ID;
  style.setAttribute("data-studio", "demo-pseudo-bridge");
  style.setAttribute(
    "data-studio-bridge-rules",
    String(DEMO_PSEUDO_BRIDGE_MAX_RULES - budget.remaining)
  );
  style.textContent = chunks.join("\n");
  document.head.appendChild(style);
}

/** Test / teardown helper. */
export function removeDemoPseudoBridge(): void {
  document.getElementById(BRIDGE_STYLE_ID)?.remove();
}
