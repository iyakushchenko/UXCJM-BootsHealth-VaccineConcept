import { useEffect } from "react";

export function buildStudioDocumentTitle(
  projectLabel?: string,
  personaLabel?: string
): string {
  return ["UXML", projectLabel, personaLabel]
    .map((value) => value?.replace(/[\u0000-\u001f\u007f]+/g, " ").replace(/\s+/g, " ").trim())
    .filter(Boolean)
    .join(" - ");
}

export function useStudioDocumentTitle(projectLabel: string, personaLabel: string): void {
  useEffect(() => {
    document.title = buildStudioDocumentTitle(projectLabel, personaLabel);
  }, [projectLabel, personaLabel]);
}
