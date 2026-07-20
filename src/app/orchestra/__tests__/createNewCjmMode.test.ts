import { describe, expect, it } from "vitest";
import {
  CREATE_NEW_CJM_MODE_ID,
  CREATE_NEW_CJM_OPTION,
  isCreateNewCjmModeId,
  normalizeOrchestraModeId,
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
