import { useCallback, useEffect, useMemo, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import type { CjmOptionMetadata } from "@/app/recording/recordingMetadata";
import {
  buildCjmCompatibilitySummary,
  buildGlobalCjmDiagnostic,
} from "@/app/recording/cjmCompatibilitySummary";
import { copyDiagnosticReport } from "@/app/shell/diagnosticReport";
import { getStudioRelease } from "@/app/shell/studioRelease";
import {
  getAutonomousQaSuiteStatus,
  startQaSuiteById,
} from "@/app/shell/qaAutonomousSuite";
import { openAgentTestingLogger } from "@/app/shell/agent-testing/agentTestingOverlay";

function WarningIcon({ size = 13 }: { size?: number }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden="true">
      <path d="M12 3 2.7 20h18.6L12 3Z" fill="none" stroke="currentColor" strokeWidth="2" />
      <path d="M12 9v5m0 3v.2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function CloseIcon() {
  return <svg viewBox="0 0 16 16" width="12" height="12" aria-hidden><path d="m3 3 10 10M13 3 3 13" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /></svg>;
}

export function StudioNavCompatibilityDialog({
  metadataById,
  projectId,
  projectLabel,
}: {
  metadataById: Readonly<Record<string, CjmOptionMetadata>>;
  projectId: string;
  projectLabel: string;
}) {
  const [open, setOpen] = useState(false);
  const [copyState, setCopyState] = useState<"idle" | "copied" | "failed">("idle");
  const [suiteStatus, setSuiteStatus] = useState(getAutonomousQaSuiteStatus);
  const summary = useMemo(() => buildCjmCompatibilitySummary(metadataById), [metadataById]);
  const release = getStudioRelease();
  const running = suiteStatus.phase === "running";

  useEffect(() => {
    const update = (event: Event) => {
      const detail = (event as CustomEvent).detail;
      setSuiteStatus(detail ?? getAutonomousQaSuiteStatus());
    };
    window.addEventListener("studio:qa-suite-status", update);
    return () => window.removeEventListener("studio:qa-suite-status", update);
  }, []);

  const report = useCallback(
    () => JSON.stringify(buildGlobalCjmDiagnostic({ projectId, projectLabel, summary }), null, 2),
    [projectId, projectLabel, summary],
  );

  const copy = async () => {
    const ok = await copyDiagnosticReport(report());
    setCopyState(ok ? "copied" : "failed");
    window.setTimeout(() => setCopyState("idle"), 2200);
  };

  const runTests = () => {
    if (running) return;
    openAgentTestingLogger({ kind: "agent", title: "AGENT TESTING — all CJMs" });
    const result = startQaSuiteById("all-cjms");
    if (result.accepted) setOpen(false);
  };

  if (summary.affectedCjmCount === 0) return null;
  const warningTitle = summary.blockingIssueCount > 0
    ? `${summary.blockingIssueCount} blocking compatibility issue${summary.blockingIssueCount === 1 ? "" : "s"}`
    : `${summary.affectedCjmCount} CJM${summary.affectedCjmCount === 1 ? "" : "s"} need re-testing`;

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <button
          type="button"
          className="studio-nav-version__compat-warning"
          title={`${warningTitle}. Open diagnostics.`}
          aria-label={`${warningTitle}. Open diagnostics.`}
          data-studio-cjm-compatibility-warning="true"
        >
          <WarningIcon />
          <span>{summary.affectedCjmCount}</span>
        </button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="studio-nav-product-about__overlay" />
        <Dialog.Content className="studio-global-diagnostics" data-studio-modal="global-cjm-diagnostics">
          <header className="studio-global-diagnostics__header">
            <span className="studio-global-diagnostics__header-icon"><WarningIcon size={16} /></span>
            <div>
              <Dialog.Title>CJM compatibility</Dialog.Title>
              <Dialog.Description>{projectLabel} · UXML {release.label}</Dialog.Description>
            </div>
            <Dialog.Close asChild>
              <button type="button" className="studio-nav-product-about__close" aria-label="Close compatibility diagnostics" data-studio-action="close-global-diagnostics"><CloseIcon /></button>
            </Dialog.Close>
          </header>

          <div className="studio-global-diagnostics__summary">
            <strong>{summary.blockingIssueCount > 0
              ? `${summary.blockingIssueCount} blocking issue${summary.blockingIssueCount === 1 ? "" : "s"}`
              : `${summary.affectedCjmCount} CJM${summary.affectedCjmCount === 1 ? "" : "s"} need re-testing`}</strong>
            <span>{summary.blockingIssueCount > 0
              ? "Structurally incompatible CJMs remain blocked. Tests stop at the first real failure."
              : "Playback is allowed so the QA suite can prove each CJM and clear successful checks."}</span>
          </div>

          <div className="studio-global-diagnostics__list">
            {summary.affected.map((item) => (
              <section key={item.journeyId} className="studio-global-diagnostics__cjm">
                <div className="studio-global-diagnostics__cjm-head">
                  <div>
                    <h3>{item.label}</h3>
                    <p>{item.summary}</p>
                  </div>
                  <span>{item.playable ? "Re-test required" : "Playback blocked"}</span>
                </div>
                <ul>
                  {item.issues.map((issue) => (
                    <li key={issue.code}>
                      <p>{issue.detail}</p>
                      <code>{issue.code}</code>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>

          <footer className="studio-global-diagnostics__actions">
            <span className="studio-global-diagnostics__copy-status" aria-live="polite">
              {copyState === "copied" ? "Diagnostic copied" : copyState === "failed" ? "Couldn’t copy diagnostic" : ""}
            </span>
            <button type="button" className="studio-global-diagnostics__button" onClick={() => void copy()} data-studio-action="copy-global-diagnostic">
              {copyState === "copied" ? "Copied" : "Copy diagnostic"}
            </button>
            <button type="button" className="studio-global-diagnostics__button studio-global-diagnostics__button--primary" onClick={runTests} disabled={running} data-studio-action="run-global-tests">
              {running ? "Running…" : "Run tests"}
            </button>
          </footer>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
