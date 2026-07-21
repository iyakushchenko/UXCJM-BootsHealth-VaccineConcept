# Studio nav + control audit — 2026-07-21

**Result: PROVEN**

Scope: universal Studio engine navigation, CJM/REC transport, QA entry point, responsive containment, keyboard and assistive-technology behavior. Boots was the visible reference project, not the implementation boundary.

## Proof

- Hub and Reset are natively disabled and handler-guarded during CJM/AIR locks.
- Engine nav no longer imports the Boots project index.
- Transport and QA automation use stable `data-studio-action` selectors; the Play/Pause accessible name may change safely.
- REC drafts survive refresh and restore paused; latent paused state remains visible.
- Project/persona menus support arrows, Home/End, activation, Escape and focus return.
- Live announcements are atomic and not nested.
- At 800×700: document width = 800px, transport remains visible, stepper remains reachable, and enabled targets render at least 25.48px.
- At 700×700 with a dropdown open: progress dots are hidden in favour of `3 / 9`, document width remains 700px, popup bounds remain inside the viewport, and the bar has no scroll container.
- Prototype, chat and generic `.proto-scroll` tracks/corners are transparent.
- CJM deletion lives on each dropdown row: custom journeys expose a hover/focus trash action with confirmation; Agentic and Traditional show the same action disabled as protected built-ins. Opening Delete does not change the selected journey.
- Recorded CJM rows expose muted steps/auth/date/author metadata, an Info popup, and a conditional warning triangle. Warning hover explains the issue; click copies structured diagnostic JSON without selecting the row. Legacy sessions remain loadable and are marked as unverifiable rather than silently treated as current.
- New REC sessions stamp global auth history, Studio/contract version and user/agent provenance. Agent arm is guarded in the visible REC path, and agent saves reject internal QA/test/prove titles.
- Visible focus, contrast, single `STEPS`, touchpoint truncation/title, and CJM/REC XOR passed strict review.
- Lighthouse snapshot: Accessibility 100, Best Practices 100.
- Static gates: 11/11. Vitest: 131 files, 774 tests. Production build: pass.

## Team check

- Bea (BA): register complete; lock, refresh recovery, panel-state and accessibility acceptance pass. Knowledge used: REC/CJM/AIR XOR, refresh recovery, disabled-state truth.
- Finn (FE): engine boundary, stable automation selectors, state continuity and component tests pass. Knowledge used: cassette disappearance, stale-control and selector-stability lessons.
- Uma (UX/UI): responsive containment, contrast, focus, target size and visual hierarchy pass. Knowledge used: fidelity checklist and compact-width containment.
- Quinn (QA): keyboard matrix, transport, XOR, one-`STEPS`, stable selectors and existing-tab MCP proof pass. Knowledge used: interaction matrix and no-false-PROVEN rule.

Nonblocking forecast: modal focus containment/return and large production chunks remain separate hardening work; neither invalidates this nav/control proof.
