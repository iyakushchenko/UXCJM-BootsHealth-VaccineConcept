import {
  classifyRuntimeError,
  formatRuntimeErrorDetails,
  type RuntimeErrorHint,
} from "@/app/shell/classifyRuntimeError";
import { buildRuntimeDiagnosticReport } from "@/app/shell/diagnosticReport";
import { CopyReportButton } from "@/app/shell/CopyReportButton";

export function StudioFatalErrorScreen({
  error,
  componentStack,
  hint,
}: {
  error: unknown;
  componentStack?: string | null;
  hint?: RuntimeErrorHint;
}) {
  const resolved = hint ?? classifyRuntimeError(error);
  const details = formatRuntimeErrorDetails(error);
  const isDev = import.meta.env.DEV;

  const getReport = () =>
    buildRuntimeDiagnosticReport({
      error,
      hint: resolved,
      componentStack,
    });

  return (
    <div className="proto-fatal-error" role="alert">
      <div className="proto-fatal-error__card">
        <p className="proto-fatal-error__eyebrow">Studio prototype</p>
        <h1 className="proto-fatal-error__title">{resolved.title}</h1>
        <p className="proto-fatal-error__summary">{resolved.summary}</p>

        <section className="proto-fatal-error__section">
          <h2 className="proto-fatal-error__heading">Likely causes</h2>
          <ul className="proto-fatal-error__list">
            {resolved.likelyCauses.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>

        <section className="proto-fatal-error__section">
          <h2 className="proto-fatal-error__heading">Try this</h2>
          <ul className="proto-fatal-error__list">
            {resolved.tryThese.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>

        {(isDev || details) && (
          <details className="proto-fatal-error__details" open={isDev}>
            <summary className="proto-fatal-error__details-summary">
              Technical details
            </summary>
            <pre className="proto-fatal-error__pre">{details}</pre>
            {componentStack ? (
              <pre className="proto-fatal-error__pre proto-fatal-error__pre--stack">
                {componentStack.trim()}
              </pre>
            ) : null}
          </details>
        )}

        <div className="proto-fatal-error__actions">
          <CopyReportButton
            getReport={getReport}
            className="proto-fatal-error__btn proto-fatal-error__btn--secondary"
            copiedClassName="proto-fatal-error__btn--copied"
          />
          <button
            type="button"
            className="proto-fatal-error__btn proto-fatal-error__btn--primary"
            onClick={() => window.location.reload()}
          >
            Reload page
          </button>
        </div>
      </div>
    </div>
  );
}
