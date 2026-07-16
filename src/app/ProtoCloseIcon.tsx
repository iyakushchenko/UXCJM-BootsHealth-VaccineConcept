/** Figma `icon / gse / close` — uses currentColor for unified hover (gray → navy). */
export const PROTO_CLOSE_ICON_HTML = `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" clip-rule="evenodd" d="M12.9661 14.3461L1.65242 3.03228L3.03077 1.65392L14.3444 12.9677L12.9661 14.3461Z" fill="currentColor"/><path fill-rule="evenodd" clip-rule="evenodd" d="M3.03395 14.3461L14.3476 3.03228L12.9692 1.65392L1.6556 12.9677L3.03395 14.3461Z" fill="currentColor"/></svg>`;

export function ProtoCloseIcon({ size = 16 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M12.9661 14.3461L1.65242 3.03228L3.03077 1.65392L14.3444 12.9677L12.9661 14.3461Z"
        fill="currentColor"
      />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M3.03395 14.3461L14.3476 3.03228L12.9692 1.65392L1.6556 12.9677L3.03395 14.3461Z"
        fill="currentColor"
      />
    </svg>
  );
}
