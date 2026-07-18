import { describe, expect, it } from "vitest";
import { classifyRuntimeError } from "@/app/shell/classifyRuntimeError";

describe("classifyRuntimeError", () => {
  it("detects missing import ReferenceError", () => {
    const hint = classifyRuntimeError(
      new ReferenceError("useProtoJourneyPlayback is not defined")
    );
    expect(hint.id).toBe("missing-reference");
    expect(hint.summary).toContain("useProtoJourneyPlayback");
  });

  it("detects temporal dead zone ReferenceError", () => {
    const hint = classifyRuntimeError(
      new ReferenceError("Cannot access 'resetPrototypeScroll' before initialization")
    );
    expect(hint.id).toBe("temporal-dead-zone");
    expect(hint.summary).toContain("resetPrototypeScroll");
  });

  it("detects wrong import shape", () => {
    const hint = classifyRuntimeError(new TypeError("foo is not a function"));
    expect(hint.id).toBe("not-a-function");
  });

  it("detects stale chunk load", () => {
    const hint = classifyRuntimeError(
      new Error("Failed to fetch dynamically imported module: http://localhost:5173/src/app/App.tsx")
    );
    expect(hint.id).toBe("chunk-load");
  });

  it("detects vite transform syntax errors", () => {
    const hint = classifyRuntimeError(
      new Error(
        "Transform failed with 1 error:\nC:/proj/src/app/orchestra/useProtoJourneyPlayback.ts:312:2: ERROR: Unexpected \")\""
      )
    );
    expect(hint.id).toBe("transform-error");
    expect(hint.summary).toContain("Unexpected");
    expect(hint.summary).toContain("useProtoJourneyPlayback.ts");
  });
});
