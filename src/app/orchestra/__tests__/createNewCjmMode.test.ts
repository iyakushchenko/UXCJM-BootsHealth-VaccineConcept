import { describe, expect, it } from "vitest";
import {
  CREATE_NEW_CJM_MODE_ID,
  CREATE_NEW_CJM_OPTION,
  isCreateNewCjmModeId,
  normalizeOrchestraModeId,
  resolveFirstSavedCjmModeId,
} from "@/app/orchestra/orchestraModes";

describe("CREATE NEW CJM picker sentinel", () => {
  it("exposes a stable non-playable id + label", () => {
    expect(CREATE_NEW_CJM_MODE_ID).toBe("create-new-cjm");
    expect(CREATE_NEW_CJM_OPTION.label).toBe("CREATE NEW CJM");
    expect(isCreateNewCjmModeId(CREATE_NEW_CJM_MODE_ID)).toBe(true);
    expect(isCreateNewCjmModeId("agentic-cjm")).toBe(false);
  });

  it("is not accepted as a stored / URL orchestra mode", () => {
    expect(normalizeOrchestraModeId(CREATE_NEW_CJM_MODE_ID)).toBeUndefined();
  });
});

describe("resolveFirstSavedCjmModeId", () => {
  const modes = [
    { id: "agentic-cjm" as const, label: "Agentic CJM" },
    { id: "traditional-cjm" as const, label: "Traditional CJM" },
    { id: "rec-trad-x" as const, label: "Recorded" },
  ];

  it("prefers last non-CREATE NEW when still in catalog", () => {
    expect(resolveFirstSavedCjmModeId(modes, "traditional-cjm")).toBe(
      "traditional-cjm"
    );
  });

  it("falls back to modes[0] when preferred missing", () => {
    expect(resolveFirstSavedCjmModeId(modes, "rec-gone")).toBe("agentic-cjm");
    expect(resolveFirstSavedCjmModeId(modes)).toBe("agentic-cjm");
  });

  it("never returns CREATE NEW", () => {
    expect(
      resolveFirstSavedCjmModeId(
        [{ id: CREATE_NEW_CJM_MODE_ID, label: "CREATE NEW CJM" }, ...modes],
        CREATE_NEW_CJM_MODE_ID
      )
    ).toBe("agentic-cjm");
  });
});
