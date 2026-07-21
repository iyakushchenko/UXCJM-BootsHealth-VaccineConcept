# Studio QA chrome audit — 2026-07-21

**Result: PROVEN**

Scope: shared Studio touchpoint label and AGENT TESTING overlay chrome.

- Touchpoint slot is fixed at `12ch`; long labels ellipsize and retain their full native `title`.
- Chrome DevTools proof: slot stayed fixed while the touchpoint changed from Agentic Home to Chat; REC control x-position stayed `1474.375px`.
- First QA open used Motion from `translateY(436px) / opacity 0` to its `bottom: 16px; right: 16px` resting position in 280ms.
- Refresh while active restored the panel at rest with zero running entrance animations and retained the open session.
- Severity palette is semantic: neutral routine, blue information, amber warning, green PASS, red only blocking FAIL/Alarm. Computed proof: warning `rgb(224, 184, 92)`, PASS `rgb(105, 211, 145)`, FAIL `rgb(255, 107, 107)`.
- Session hydration preserves structured severity, paused capture, and the sealed finale; refresh does not silently resume work or steal focus.
- The overlay is an accessible named region (not a noisy page-wide live region), remains inside compact viewports, and keeps all action targets at least 24px high.
- Save Log refuses stale inactive-session evidence; full user messages remain in the diagnostic action field even when the visible row is clipped.
- Full Play now waits for committed CJM mode plus a populated step counter, then fails fast if arming cannot complete instead of hanging at 0/N.
- Chrome DevTools proof: Agentic full Play passed `22/22`, returned to `agentic-home`, reported zero chat jumps/chops, and raised no PO signal.
- Sealed RESULT truth remains last across refresh; full user messages persist as structured ring actions and survive hydration into Save Log evidence.
- REC arming now uses bounded state polling for CJM, REC, CREATE NEW, deck mount, and live-session transitions. A fresh Traditional recording/playback proved `rec-trad-mrusofhx-icr5` at `21/21` with no errors.
- QA self-test passed `28/28`; full static gates and all `768/768` Vitest checks passed without unhandled errors; production build passed. QA circular-chunk warnings were removed by direct overlay imports. Only the existing bundle-size advisory remains.

Uma fidelity: PASS — stable chrome, deliberate truncation, native hover title, no new style variant.

Quinn interaction matrix: PASS — first open, refresh restore, label change, semantic outcomes, and localhost visibility verified through Chrome DevTools MCP.
