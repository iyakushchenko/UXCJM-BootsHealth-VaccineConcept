/** True when manual step forward should advance instead of re-running the director script. */
export function shouldAdvanceCompletedDirectorStep(options: {
  manualStep?: boolean;
  advanceAfter: boolean;
  lastAutoRunId: string | null;
  beatRunId: string;
}): boolean {
  return (
    Boolean(options.manualStep) &&
    options.advanceAfter &&
    options.lastAutoRunId === options.beatRunId
  );
}

/** True when transport no-op guard should stay silent after a completed director run on the same beat. */
export function shouldSuppressTransportNoOpForCompletedDirector(options: {
  lastAutoRunId: string | null;
  beatRunId: string;
}): boolean {
  return options.lastAutoRunId === options.beatRunId;
}
