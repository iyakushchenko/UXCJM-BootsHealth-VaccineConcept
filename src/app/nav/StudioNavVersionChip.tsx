import { getStudioRelease } from "@/app/shell/studioRelease";
import { openAgentTestingLogger } from "@/app/shell/agent-testing/agentTestingOverlay";

/**
 * Sticky right chip on the page-tabs row — version + channel.
 * QA icon opens the free-form agent-testing logger (diag gate).
 */
export function StudioNavVersionChip() {
  const release = getStudioRelease();

  return (
    <div
      className="studio-nav-version"
      data-studio-version={release.version}
      data-studio-channel={release.channel}
      title={`UX Studio ${release.label} (${release.channel})`}
      aria-label={`UX Studio ${release.label}, ${release.channel} channel`}
    >
      <button
        type="button"
        className="studio-nav-version__qa"
        title="Open QA logger (PLAYBACK_DIAG gate)"
        aria-label="Open QA logger"
        data-studio-qa-logger="true"
        onClick={() => {
          // Prefer window API so Vite HMR cannot fork overlay `active` vs helpers.
          if (typeof window.__studioOpenQaLogger === "function") {
            window.__studioOpenQaLogger();
          } else {
            openAgentTestingLogger();
          }
        }}
      >
        <svg
          className="studio-nav-version__qa-icon"
          viewBox="0 0 16 16"
          width="12"
          height="12"
          aria-hidden="true"
          focusable="false"
        >
          <path
            fill="currentColor"
            d="M8 1.5a6.5 6.5 0 1 0 4.03 11.6l1.68 1.68a.75.75 0 0 0 1.06-1.06l-1.68-1.68A6.5 6.5 0 0 0 8 1.5Zm0 1.5a5 5 0 1 1 0 10A5 5 0 0 1 8 3Zm-.75 2.25a.75.75 0 0 1 1.5 0v3.5a.75.75 0 0 1-1.5 0v-3.5ZM8 11.25a.75.75 0 1 1 0-1.5.75.75 0 0 1 0 1.5Z"
          />
        </svg>
      </button>
      <span className="studio-nav-version__semver">{release.label}</span>
      <span
        className={`studio-nav-version__channel studio-nav-version__channel--${release.channel}`}
      >
        {release.channel}
      </span>
    </div>
  );
}
