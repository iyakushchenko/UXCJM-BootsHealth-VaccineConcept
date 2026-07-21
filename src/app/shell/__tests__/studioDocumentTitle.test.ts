import { describe, expect, it } from "vitest";
import { buildStudioDocumentTitle } from "@/app/shell/studioDocumentTitle";

describe("studio document title", () => {
  it("composes product, full project identity, and concise persona", () => {
    expect(buildStudioDocumentTitle("Boots Pharmacy", "Sarah J.")).toBe(
      "UXML - Boots Pharmacy - Sarah J."
    );
  });

  it("preserves declared casing and omits missing segments", () => {
    expect(buildStudioDocumentTitle("UXDS - Larkin", "李")).toBe("UXML - UXDS - Larkin - 李");
    expect(buildStudioDocumentTitle()).toBe("UXML");
  });
});
