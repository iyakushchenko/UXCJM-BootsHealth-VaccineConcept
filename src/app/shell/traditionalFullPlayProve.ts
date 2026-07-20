/**
 * Thin traditional preset — all logic lives in {@link runFullPlayProve}.
 * Prefer `__studioRunFullPlayProve({ experience: "traditional" })`.
 */

export {
  TRADITIONAL_FULL_PLAY_EXPECTED_PEAK,
  TRADITIONAL_FULL_PLAY_PROVE_DEFAULT_TIMEOUT_MS,
  runTraditionalFullPlayProve,
  runFullPlayProve,
  type FullPlayProveOptions,
  type FullPlayProveResult,
  type TraditionalFullPlayProveOptions,
  type TraditionalFullPlayProvePeak,
  type TraditionalFullPlayProveResult,
} from "@/app/shell/fullPlayProve";
