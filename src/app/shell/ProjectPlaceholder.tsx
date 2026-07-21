type Props = {
  projectLabel: string;
};

/** Shown when a registered project has no wire component yet. */
export function ProjectPlaceholder({ projectLabel }: Props) {
  return (
    <div className="studio-empty-project" data-studio-empty-project data-project-label={projectLabel}>
      <div className="studio-empty-project__content">
        <StudioNavLogo size={44} className="studio-empty-project__logo" />
        <p className="studio-empty-project__eyebrow">UXML project</p>
        <h1>{projectLabel}</h1>
        <p className="studio-empty-project__message">
          This project is ready. No pages are connected yet.
        </p>
        <p className="studio-empty-project__hint">
          Add a page or connect a concept to begin.
        </p>
      </div>
    </div>
  );
}
import { StudioNavLogo } from "@/app/nav/StudioNavLogo";
