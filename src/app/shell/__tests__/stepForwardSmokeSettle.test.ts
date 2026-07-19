import { describe, expect, it, vi } from "vitest";
import {
  directorTransportBusy,
  stateFingerprint,
  stepSettleMsForState,
  waitForDirectorSettle,
} from "@/app/shell/stepForwardSmokeSettle";

describe("stepForwardSmokeSettle", () => {
  it("marks on-air / playing as busy", () => {
    expect(directorTransportBusy({ isOnAir: true, isPlaying: false })).toBe(
      true
    );
    expect(directorTransportBusy({ isOnAir: false, isPlaying: true })).toBe(
      true
    );
    expect(directorTransportBusy({ isOnAir: false, isPlaying: false })).toBe(
      false
    );
  });

  it("budgets choose-location / login for chained location pick", () => {
    expect(stepSettleMsForState({ beatId: "choose-location" })).toBe(45_000);
    expect(stepSettleMsForState({ beatId: "traditional-login" })).toBe(45_000);
    expect(stepSettleMsForState({ beatId: "traditional-plp" })).toBe(10_000);
  });

  it("waits while director is on-air before settling", async () => {
    const samples = [
      {
        beatId: "choose-location",
        counter: "STEPS: 3 / 11",
        isOnAir: true,
        isPlaying: true,
        diagnosticOpen: false,
      },
      {
        beatId: "choose-location",
        counter: "STEPS: 3 / 11",
        isOnAir: true,
        isPlaying: true,
        diagnosticOpen: false,
      },
      {
        beatId: "choose-location",
        counter: "STEPS: 3 / 11",
        isOnAir: false,
        isPlaying: false,
        diagnosticOpen: false,
      },
      {
        beatId: "choose-location",
        counter: "STEPS: 3 / 11",
        isOnAir: false,
        isPlaying: false,
        diagnosticOpen: false,
      },
      {
        beatId: "choose-location",
        counter: "STEPS: 3 / 11",
        isOnAir: false,
        isPlaying: false,
        diagnosticOpen: false,
      },
      {
        beatId: "choose-location",
        counter: "STEPS: 3 / 11",
        isOnAir: false,
        isPlaying: false,
        diagnosticOpen: false,
      },
      {
        beatId: "choose-location",
        counter: "STEPS: 3 / 11",
        isOnAir: false,
        isPlaying: false,
        diagnosticOpen: false,
      },
    ];
    let i = 0;
    const delay = vi.fn(async () => {
      i = Math.min(i + 1, samples.length - 1);
    });
    const settled = await waitForDirectorSettle(samples[0]!, 10_000, {
      delay,
      getState: () => samples[i],
    });
    expect(settled?.isOnAir).toBe(false);
    expect(directorTransportBusy(settled)).toBe(false);
    expect(delay.mock.calls.length).toBeGreaterThan(2);
  });

  it("fingerprints beat + avail for progress detection", () => {
    expect(
      stateFingerprint({
        counter: "1 / 2",
        beatId: "a",
        label: "L",
        availStep: "list",
      })
    ).toBe("1 / 2|a|L|list");
  });
});
