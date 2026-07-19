import type { PersonaDefinition, ProjectDefinition, ProjectId, PersonaId } from "@/projects/types";
import { BOOTS_PHARMACY_PROJECT } from "@/projects/boots-pharmacy";
import { PUMA_PROJECT } from "@/projects/puma";
import * as bootsPharmacyContent from "@/projects/boots-pharmacy/content";
import * as pumaContent from "@/projects/puma/content";

export const STUDIO_PROJECTS: ProjectDefinition[] = [
  BOOTS_PHARMACY_PROJECT,
  PUMA_PROJECT,
];

const PROJECT_BY_ID = new Map<ProjectId, ProjectDefinition>(
  STUDIO_PROJECTS.map((project) => [project.id, project])
);

const PROJECT_CONTENT_BY_ID: Record<ProjectId, typeof bootsPharmacyContent | typeof pumaContent> = {
  [BOOTS_PHARMACY_PROJECT.id]: bootsPharmacyContent,
  [PUMA_PROJECT.id]: pumaContent,
};

export function getProjectContent(projectId: ProjectId) {
  const project = getProjectById(projectId) ?? getDefaultProject();
  return PROJECT_CONTENT_BY_ID[project.id] ?? bootsPharmacyContent;
}

export function getProjectWire(projectId: ProjectId) {
  return getProjectById(projectId)?.wireComponent;
}
export function getProjectById(projectId: ProjectId): ProjectDefinition | undefined {
  return PROJECT_BY_ID.get(projectId);
}

export function getDefaultProject(): ProjectDefinition {
  return STUDIO_PROJECTS[0]!;
}

export function getPersonaById(
  project: ProjectDefinition,
  personaId: PersonaId
): PersonaDefinition | undefined {
  return project.personas.find((persona) => persona.id === personaId);
}

export function getDefaultPersona(
  project: ProjectDefinition
): PersonaDefinition {
  return (
    getPersonaById(project, project.defaultPersonaId) ?? project.personas[0]!
  );
}
