# FE/UI/UX audit — modal handoff + QA viewport gutter

**Date:** 2026-07-22  
**Verdict:** PROVEN  
**Scope:** terminal modal navigation, playback diagnostics, QA/REC viewport frame

## Strict fidelity result

- **Transition continuity — PASS:** terminal modal actions keep the modal mounted as a visual bridge until the destination screen commits; popup teardown and screen selection share the shell transition transaction.
- **No source-page flash — PASS:** Chrome DevTools frame sampling observed `chat + modal` → `book-step-2 + modal` → `book-step-2`; it never observed `chat` without the modal after the terminal click.
- **Viewport ownership — PASS:** the active QA/REC frame reserves a 10px root gutter on every side. The frame no longer overlays product UI, and content width/height remain bounded by the viewport.
- **Engine portability — PASS:** stray-popup detection is based on beat semantics, interaction ownership, and settled destination state—not a Boots screen or CJM identifier.
- **Motion/style discipline — PASS:** the change reuses the existing shell transition and frame treatment; no new animation system or style variant was introduced.
- **Responsive risk — PASS:** the reserved gutter is fixed and included in root sizing; the product surface cannot extend beneath the QA ring.

## Proof

- Live Agentic continuous playback: **PASS 22/22**, no QA alarm, no modal handoff gap.
- Full static gates: **11/11 PASS**.
- Vitest: **147 files / 866 tests PASS**.
- Production build: **PASS**.
- Diff whitespace check: **PASS**.

## Forecast / non-blocking observation

Traditional fast playback independently surfaced an existing director-monitor race when a selection is already applied (`selection-without-director` on `book-step2-time`). It is outside this UI handoff scope and was truthfully stopped by QA rather than hidden. The requested transition and frame surfaces remain PROVEN.

