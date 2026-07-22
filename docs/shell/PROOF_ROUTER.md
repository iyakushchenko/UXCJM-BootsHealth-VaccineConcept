# Proof router — choose one canonical path

**Purpose:** Start here for localhost proof. Pick the row that matches the risk, run its blessed helper, and store the named evidence. The linked contract owns the details; this router does not redefine them.

**Stuck / unknown / same FAIL twice?** Do not invent a prove path — open [AGENT_STUCK_ROUTER.md](../product/AGENT_STUCK_ROUTER.md) first (one dig), then return here for the blessed helper.

**PO shorthand (`uxml rec` / `uxml play` / `uxml play step` / `uxml play step r`):** use the locked procedures in [UXML_COMMANDS.md](./UXML_COMMANDS.md) — default = **current CJM** unless PO names another; always include QA overlay + DevTools MCP watched run.

**Always:** use the existing `http://localhost:5173/` tab; run one Vite server; start from a fresh QA session; keep the AGENT TESTING overlay visible; consume PO signals each beat; finish with clean teardown. See [RECORDING.md](./RECORDING.md) and [QA_LOGGING_AND_PLAYBACK_RECIPE.md](./QA_LOGGING_AND_PLAYBACK_RECIPE.md).

| Task / risk | Blessed entry point | PASS evidence | Canonical details |
|-------------|---------------------|---------------|-------------------|
| Migrated-page parity | `await window.__studioRunMcpPageProbe?.({ screenId: "<screenId>" })` | Dated audit matrix; all changed hover/click/state steps PASS; overlay visible; below-fold targets scrolled into view; `PARITY_PROVEN.json` honest | [FE_UI_UX_AUDIT](../product/FE_UI_UX_AUDIT.md) D5 + J1–J6 · [RECORDING](./RECORDING.md) |
| Page close / next-page unlock | `npm run check:page-final-pass` **after** Uma audit + Quinn page probe | Audit PROVEN with evidence; parity manifest green; Final Pass manifest green; team-check matrix PASS | [PAGE_FINAL_PASS](../product/PAGE_FINAL_PASS.md) |
| Continuous Play · **`uxml play`** | `await window.__studioRunFullPlayProve?.({ journeyId })` or `{ experience }` (default = current CJM) | `{ pass: true }`; QA overlay retained at result; Play-end/reset and diagnostic evidence; Save Log when requested | [UXML_COMMANDS](./UXML_COMMANDS.md) · [QA recipe](./QA_LOGGING_AND_PLAYBACK_RECIPE.md) · [PLAYBACK_DIAG](./PLAYBACK_DIAG.md) |
| Stepped Play · **`uxml play step`** | `__protoRunAgenticStepForwardSmoke` / `__protoRunTraditionalStepForwardSmoke` | Smoke `{ pass: true }`; PO signals polled each beat | [UXML_COMMANDS](./UXML_COMMANDS.md) · [PLAYBACK_DIAG](./PLAYBACK_DIAG.md) |
| Stepped + rewind · **`uxml play step r`** | Step-forward smoke **then** `__protoRunRetreatSmoke` / `__protoRunTraditionalRetreatSmoke` | Both segments PASS; Step back exercised | [UXML_COMMANDS](./UXML_COMMANDS.md) · [PLAYBACK_DIAG](./PLAYBACK_DIAG.md) |
| REC robustness · **`uxml rec`** | `await window.__studioRunRecNewCjmProve?.({ experience })` (default experience from URL/state) | Newly captured `rec-*` journey; live REC latch; human-paced capture; blocking modals drained; Stop → Add as CJM → Play that journey; `{ pass, journeyId, recLive, peak, errors }` | [UXML_COMMANDS](./UXML_COMMANDS.md) · [RECORDING](./RECORDING.md) · [CJM record/play/edit](./CJM_RECORD_PLAY_EDIT.md) |
| Traditional Play smoke only | `await window.__protoRunTraditionalPlaySmoke?.()` | Smoke result; note that overlay teardown means this is not the Save Log / Final Pass path | [QA recipe](./QA_LOGGING_AND_PLAYBACK_RECIPE.md) |
| Studio chrome / mode XOR | `window.__studioRunMcpSanityCheck?.()` plus direct localhost state checks | AIR locks REC/CJM controls; REC ⊗ CJM; labels/counters/panel XOR; no duplicate chrome | [FE_UI_UX_AUDIT](../product/FE_UI_UX_AUDIT.md) G1–G9 |
| PO Alarm / Cursor / Scroll | `window.__studioConsumePoSignal?.()` at each beat | STOP → understand `diagSnapshot` (ask if unclear) → fix → restart → prove the exact issue gone | [PLAYBACK_DIAG](./PLAYBACK_DIAG.md) · [STUDIO_AUTO_RULES](../product/STUDIO_AUTO_RULES.md) R15 |

## Evidence minimum

1. Record the commit/tip or exact local state being proved; stale-tip evidence cannot close a changed interaction surface.
2. Record the helper and inputs, PASS/FAIL counts or returned result, and the changed interactions observed.
3. For visual/state PASS, cite the source reference and the browser observation or measurement.
4. For page audits, cite stable [FE audit row IDs](../product/FE_UI_UX_AUDIT.md); an applicable PASS without evidence is incomplete.
5. On FAIL or a PO signal, do not continue blind or convert the result to green. Fix and rerun the relevant path.

## Teardown

Page probes and QA helpers must leave the current product screen usable: overlay/dialog gone when the chosen helper owns teardown, ephemeral `modal` state stripped, and no stale robo-cursor or capture session. Full Play prove intentionally keeps the overlay open for result review / Save Log; clear it only after evidence is captured.
