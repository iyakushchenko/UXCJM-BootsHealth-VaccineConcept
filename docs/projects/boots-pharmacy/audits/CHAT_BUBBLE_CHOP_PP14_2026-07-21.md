# PP-14 chat bubble chop audit — 2026-07-21

**Status:** PROVEN — uninterrupted agentic Play reached 22/22 with zero bubble jumps/chops

## Root-cause findings

1. Bubble pull-up and camera co-travel previously used different easing curves.
2. `HelpfulStrip` previously changed reply height at the 340 ms landing boundary.
3. The 8/8 self-test excluded layout movement during co-travel, masking the PO-visible composite trajectory.
4. Element `align: end` targeted the normal viewport, not the overlaid composer clearance, so camera travel resolved to `0` and the late host-end top-up snapped `447px`.
5. Replacing an active camera rAF could cancel its callback without settling the awaiting animation promise.

## Implemented slice

- Centralized the exact Motion ease-in-out cubic-bezier and reused its numeric evaluator for chat camera co-travel.
- Reserved HelpfulStrip geometry from the first reply frame; its paint now follows the same arrival transition.
- Preserved the compact centered HelpfulStrip geometry through a scoped wrapper.
- Kept fixed-path deviation checks for ordinary scrolls; dynamic Chat co-travel is instead guarded by the bubble/layout discontinuity diagnostics.
- Kept dynamic co-travel alive when its initial scroll range is zero, and settled replaced animation promises.
- Routed reply co-travel to the thread extent, the correct camera coordinate with an overlaid composer.

## Verification

- Focused final Chat/motion/scroll slice: **61/61 PASS**.
- Production build: **PASS** (pre-existing Rollup circular-chunk/size warnings remain).
- Repository gates/tests: **11/11 gates and 127/127 test files PASS**.
- ALWAYS CLEAR uninterrupted agentic Play: **PASS**, peak **22/22**, play-end returned to journey start, no PO signal.
- Live bubble telemetry: **109 samples, 0 jumps, 0 chops**. The former r0 path eased progressively through `1 → 29 → 131 → 278 → 397 → 447px` rather than snapping.

## Strict audit decision

Uma fidelity: **PASS** — reply/helpful geometry is reserved at mount and bubble/camera share one ease; no late composer snap.

Quinn interaction matrix: **PASS** — dynamic co-travel passes, injected fixed-path/discontinuity controls still fail, replacement promises settle, and the full 22-frame product path completes.

## Decision

PP-14 is technically PROVEN. Product Owner visual acceptance remains authoritative, but there is no remaining audit blocker from this defect.
