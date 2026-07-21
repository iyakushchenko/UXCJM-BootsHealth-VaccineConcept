import { useEffect, useRef, useState } from "react";
import type { CjmOptionMetadata } from "@/app/recording/recordingMetadata";
import { logControlPanel } from "@/app/shell/controlPanelLog";

type Props = { metadata: CjmOptionMetadata };

function InfoIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 16 16" fill="none" aria-hidden>
      <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.4" />
      <path d="M8 7v4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      <circle cx="8" cy="4.7" r=".8" fill="currentColor" />
    </svg>
  );
}

function WarningIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 16 16" fill="none" aria-hidden>
      <path d="M8 2 14 13H2L8 2Z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
      <path d="M8 6v3.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      <circle cx="8" cy="11.5" r=".7" fill="currentColor" />
    </svg>
  );
}

async function copyDiagnostic(metadata: CjmOptionMetadata): Promise<boolean> {
  const text = JSON.stringify(metadata.diagnostic, null, 2);
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    try {
      const area = document.createElement("textarea");
      area.value = text;
      area.style.position = "fixed";
      area.style.opacity = "0";
      document.body.append(area);
      area.select();
      const copied = document.execCommand("copy");
      area.remove();
      return copied;
    } catch {
      return false;
    }
  }
}

export function StudioNavCjmMetadata({ metadata }: Props) {
  const rootRef = useRef<HTMLSpanElement>(null);
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const warningDetail = metadata.issues.map((issue) => issue.detail).join(" ");

  useEffect(() => {
    if (!open) return;
    const closeOutside = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const closeEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", closeOutside, true);
    document.addEventListener("keydown", closeEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOutside, true);
      document.removeEventListener("keydown", closeEscape);
    };
  }, [open]);

  return (
    <span ref={rootRef} className="studio-nav-cjm-meta">
      <button
        type="button"
        className="studio-nav-cjm-meta__icon"
        aria-label={`CJM information: ${metadata.label}`}
        title={`CJM information: ${metadata.summary}`}
        aria-expanded={open}
        aria-haspopup="dialog"
        onClick={(event) => {
          event.stopPropagation();
          setOpen((value) => !value);
        }}
      >
        <InfoIcon />
      </button>
      {metadata.issues.length > 0 ? (
        <button
          type="button"
          className="studio-nav-cjm-meta__icon studio-nav-cjm-meta__icon--warning"
          aria-label={`Copy CJM diagnostic: ${metadata.label}`}
          title={`${copied ? "Copied. " : "Click to copy diagnostic. "}${warningDetail}`}
          onClick={async (event) => {
            event.stopPropagation();
            const ok = await copyDiagnostic(metadata);
            setCopied(ok);
            logControlPanel("recording:copy-cjm-diagnostic", {
              journeyId: metadata.journeyId,
              issueCount: metadata.issues.length,
              copied: ok,
            });
          }}
        >
          <WarningIcon />
        </button>
      ) : null}
      {open ? (
        <div className="studio-nav-cjm-meta__panel" role="dialog" aria-label={`CJM information: ${metadata.label}`}>
          <strong className="studio-nav-cjm-meta__title">{metadata.label}</strong>
          <dl className="studio-nav-cjm-meta__list">
            <div><dt>Steps</dt><dd>{metadata.stepCount}</dd></div>
            <div><dt>Authentication</dt><dd>{metadata.authLabel}</dd></div>
            <div><dt>Recorded</dt><dd>{metadata.recordedAtLabel}</dd></div>
            <div><dt>Author</dt><dd>{metadata.authorLabel}</dd></div>
          </dl>
          {metadata.issues.length > 0 ? (
            <div className="studio-nav-cjm-meta__issues">
              {metadata.issues.map((issue) => <p key={issue.code}>{issue.detail}</p>)}
            </div>
          ) : (
            <p className="studio-nav-cjm-meta__compatible">No compatibility issues detected.</p>
          )}
        </div>
      ) : null}
    </span>
  );
}
