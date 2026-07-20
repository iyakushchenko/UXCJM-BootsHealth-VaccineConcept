import { useCallback } from "react";
import {
  formatPlaybackDiagnostic,
  formatPlaybackDiagnosticDetails,
  type PlaybackDiagnosticError,
} from "@/app/shell/playbackDiagnostic";
import { buildPlaybackDiagnosticReport } from "@/app/shell/diagnosticReport";
import { CopyReportButton } from "@/app/shell/CopyReportButton";
import { studioPanelTransition } from "@/app/nav/studioMotion";
import { AnimatePresence, motion } from "@/uxds/motion";

type Props = {
  error: PlaybackDiagnosticError | null;
  onDismiss: () => void;
};

export function PlaybackDiagnosticOverlay({
  error,
  onDismiss,
}: Props) {
  const getReport = useCallback(
    () => (error ? buildPlaybackDiagnosticReport(error) : ""),
    [error]
  );

  const isDev = import.meta.env.DEV;
  const hint = error ? formatPlaybackDiagnostic(error) : null;
  const details = error ? formatPlaybackDiagnosticDetails(error) : "";

  return (
    <AnimatePresence initial={false}>
      {error && hint ? (
        <motion.div
          key="playback-diagnostic"
          className="studio-playback-diagnostic"
          role="alertdialog"
          aria-modal="false"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.12 } }}
          transition={studioPanelTransition}
        >
          <div className="studio-playback-diagnostic__card">
            <p className="studio-playback-diagnostic__eyebrow">Playback diagnostic</p>
            <h2 className="studio-playback-diagnostic__title">{hint.title}</h2>
            <p className="studio-playback-diagnostic__summary">{hint.summary}</p>

            {(isDev || details) && (
              <details className="studio-playback-diagnostic__details" open={isDev}>
                <summary className="studio-playback-diagnostic__details-summary">
                  Technical details
                </summary>
                <pre className="studio-playback-diagnostic__pre">{details}</pre>
              </details>
            )}

            <div className="studio-playback-diagnostic__actions">
              <CopyReportButton
                getReport={getReport}
                className="studio-playback-diagnostic__btn studio-playback-diagnostic__btn--primary"
                copiedClassName="studio-playback-diagnostic__btn--copied"
              />
              <button
                type="button"
                className="studio-playback-diagnostic__btn"
                onClick={onDismiss}
              >
                Cancel
              </button>
            </div>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
