/**
 * Step-forward smoke settle — wait for director on-air/playing to clear
 * before the next manual step (login→choose-location chains book-location-pick).
 */

export type DirectorSettleState = {
  counter?: string | null;
  beatId?: string | null;
  label?: string | null;
  availStep?: string | null;
  diagnosticOpen?: boolean;
  isOnAir?: boolean;
  isPlaying?: boolean;
};

export function stateFingerprint(
  state: DirectorSettleState | undefined | null
): string {
  if (!state) return "";
  return [state.counter, state.beatId, state.label, state.availStep].join("|");
}

export function stepSettleMsForState(
  state: DirectorSettleState | undefined
): number {
  if (!state) return 4000;
  if (state.beatId === "agentic-home") return 50_000;
  if (state.beatId === "agentic-chat") return 12_000;
  if (state.beatId === "traditional-plp" || state.beatId === "traditional-pdp") {
    return 10_000;
  }
  // login chains into book-location-pick — must outlast full Step 1 picker.
  if (
    state.beatId === "traditional-login" ||
    state.beatId === "choose-location"
  ) {
    return 45_000;
  }
  if (state.label?.toLowerCase().includes("thinking")) return 12_000;
  if (state.beatId?.startsWith("book-step2")) return 22_000;
  if (state.beatId?.startsWith("avail-")) return 10_000;
  return 6000;
}

/** True while director cursor scripts / autoplay still own the transport. */
export function directorTransportBusy(
  state: Pick<DirectorSettleState, "isOnAir" | "isPlaying"> | undefined | null
): boolean {
  return Boolean(state?.isOnAir || state?.isPlaying);
}

export async function waitForDirectorSettle<T extends DirectorSettleState>(
  state: T,
  maxMs: number,
  options: {
    delay: (ms: number) => Promise<void>;
    getState: () => T | undefined;
  }
): Promise<T | undefined> {
  if (maxMs <= 0) return options.getState();

  const longStableBeat =
    state.beatId?.startsWith("book-step2") ||
    state.beatId === "choose-location" ||
    state.beatId === "traditional-login" ||
    state.beatId === "agentic-home";
  const stableMs = longStableBeat ? 1200 : 800;
  const deadline = Date.now() + maxMs;
  let idleSince: number | null = null;
  let lastFingerprint = stateFingerprint(state);

  while (Date.now() < deadline) {
    const current = options.getState();
    if (current?.diagnosticOpen) {
      return current;
    }

    if (directorTransportBusy(current)) {
      idleSince = null;
      lastFingerprint = stateFingerprint(current);
      await options.delay(250);
      continue;
    }

    const fingerprint = stateFingerprint(current);
    if (fingerprint !== lastFingerprint) {
      lastFingerprint = fingerprint;
      idleSince = null;
      await options.delay(250);
      continue;
    }

    if (idleSince == null) {
      idleSince = Date.now();
    } else if (Date.now() - idleSince >= stableMs) {
      return current;
    }
    await options.delay(250);
  }

  return options.getState();
}
