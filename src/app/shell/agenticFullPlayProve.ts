/**
 * Thin agentic preset — all logic lives in {@link runFullPlayProve}.
 * Prefer `__studioRunFullPlayProve({ experience: "agentic" })`.
 */

export {
  AGENTIC_FULL_PLAY_EXPECTED_PEAK,
  AGENTIC_FULL_PLAY_PROVE_DEFAULT_TIMEOUT_MS,
  runAgenticFullPlayProve,
  runFullPlayProve,
  type AgenticFullPlayProveOptions,
  type AgenticFullPlayProvePeak,
  type AgenticFullPlayProveResult,
  type FullPlayProveOptions,
  type FullPlayProveResult,
} from "@/app/shell/fullPlayProve";
