import { describe, expect, it } from "vitest";
import { buildBookProgressSteps } from "@/uxds/components/BookAppointmentProgress";

describe("buildBookProgressSteps", () => {
  it("marks step 1 current and later upcoming", () => {
    const steps = buildBookProgressSteps(1);
    expect(steps.map((s) => s.state)).toEqual([
      "current",
      "upcoming",
      "upcoming",
    ]);
    expect(steps[0].onActivate).toBeUndefined();
  });

  it("wires back on completed step 1 from step 2", () => {
    const back = () => undefined;
    const steps = buildBookProgressSteps(2, { onBackToStep1: back });
    expect(steps.map((s) => s.state)).toEqual([
      "completed",
      "current",
      "upcoming",
    ]);
    expect(steps[0].onActivate).toBe(back);
  });

  it("confirmation completes prior steps and highlights step 3", () => {
    const steps = buildBookProgressSteps(3, { confirmationComplete: true });
    expect(steps.map((s) => s.state)).toEqual([
      "completed",
      "completed",
      "current",
    ]);
  });
});
