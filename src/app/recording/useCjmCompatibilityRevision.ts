import { useEffect, useState } from "react";

/** Rebuild compatibility metadata as autonomous proofs land. */
export function useCjmCompatibilityRevision(): number {
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    const refresh = () => setRevision((value) => value + 1);
    window.addEventListener("studio:cjm-compatibility-proof", refresh);
    return () => window.removeEventListener("studio:cjm-compatibility-proof", refresh);
  }, []);
  return revision;
}
