/** @vitest-environment happy-dom */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { PromoMessageStrip } from "../PromoMessageStrip";

const css = readFileSync(
  resolve(__dirname, "../promo-message-strip.css"),
  "utf8"
);

describe("PromoMessageStrip kit", () => {
  it("exports a reusable logo + text + cta API", () => {
    expect(typeof PromoMessageStrip).toBe("function");
  });

  it("uses soft mint surface token (no page-local promo fill)", () => {
    expect(css).toMatch(
      /\.uxds-promo-message-strip\s*\{[\s\S]*?background:\s*var\(--uxds-surface-accent-soft\)/
    );
  });

  it("does not style the CTA button (kit TertiaryCta owns chrome)", () => {
    expect(css).not.toMatch(/\.studio-tertiary-cta/);
    expect(css).not.toMatch(/button\s*\{/);
  });
});
