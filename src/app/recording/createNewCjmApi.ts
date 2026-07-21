/**
 * Imperative CREATE NEW CJM selector — mirrors JourneyMenu picker path
 * so agents can arm REC without inventing a parallel UI state.
 */

type CreateNewSelector = () => void;

let selectCreateNewImpl: CreateNewSelector | null = null;

export function registerCreateNewCjmSelector(
  fn: CreateNewSelector | null
): void {
  selectCreateNewImpl = fn;
}

/** Same effect as picking CREATE NEW CJM in the orchestra menu. */
export function selectCreateNewCjm(): boolean {
  if (!selectCreateNewImpl) return false;
  selectCreateNewImpl();
  return true;
}
