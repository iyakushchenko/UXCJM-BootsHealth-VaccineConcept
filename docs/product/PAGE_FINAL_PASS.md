# Page Final Pass — hard-green gate

**Status:** Locked sequencing (Arch / PO mandate, 2026-07-19)  
**Owners:** **Arch (Director)** — sequencing + veto; **Finn (FE) + Uma (UI/UX)** — checklist criteria + `scripts/check-page-final-pass.mjs` (single contract — do not fork)  
**Hard-wired:** [COMMAND_DOCTRINE.md](./COMMAND_DOCTRINE.md) · [TEAM.md](./TEAM.md) · [NEXT_STEPS.md](./NEXT_STEPS.md) · [AGENTS.md](../../AGENTS.md) · [`.cursor/rules/ux-studio-director.mdc`](../../.cursor/rules/ux-studio-director.mdc)

---

## Sequencing rule (non-negotiable)

**No new migrated page** until the **previous** page in the erase-Make sequence is **PAGE FINAL PASS hard-green**.

| Sequence (Boots) | Previous must be hard-green before… |
|------------------|-------------------------------------|
| PLP | …starting **PDP** |
| PDP | …starting **Home** |
| Home | …starting **Chat** |
| Chat | …starting **History/Details** |
| History/Details | …deleting Book 1–3 Make children |

Arch **rejects** “start next page” / Bea brief / Finn mount for the next screen while the previous page’s Final Pass is not hard-green. **Parallel callsigns remain mandatory** for serious streams. **`Knowledge used:`** remains mandatory on team check ([TEAM.md](./TEAM.md) § Knowledge use).

---

## What “hard-green” means

A page is **PAGE FINAL PASS hard-green** only when **all** are true:

1. Erase-Make **DONE** definition in [NEXT_STEPS.md](./NEXT_STEPS.md) (React mount + Make retired + wire gates + no LEGACY growth + honest residual).  
2. Uma FE audit **PROVEN** + Quinn MCP real-user matrix in `PARITY_PROVEN.json` (`check:parity-proven` green).  
3. Team check green for that screen — including **`Knowledge used:`** per role, Uma fidelity + typical DS checks, Bea register (no Missing P0), Quinn interaction matrix.  
4. **This gate green:** `npm run check:page-final-pass` — manifest stamp `status: "proven"` + full checklist + source contracts (see below).  
5. Quinn MCP prove cited after stamp (manifest notes may say “Quinn MCP follow-up” — Arch does **not** open the next page until Quinn team-check matrix PASS).

PROVEN / tests green alone are **insufficient** to open the next page. Final Pass is the erase-Make **page-close** bar.

---

## Artifacts (Finn / Uma — do not duplicate)

| Artifact | Path | Owner |
|----------|------|-------|
| Policy (this file) | `docs/product/PAGE_FINAL_PASS.md` | Arch sequencing; Finn/Uma criteria |
| Per-project manifest | `docs/projects/<id>/audits/PAGE_FINAL_PASS.json` | Finn + Uma stamp; Ben keeps honest |
| Check script | `scripts/check-page-final-pass.mjs` | Finn + Uma |
| npm wire | `npm run check:page-final-pass` (in `npm test`) | Ben / Finn |

### Checklist keys (manifest + script — source of truth)

Do **not** re-list a parallel checklist elsewhere. Extend keys in the script + JSON together:

| Key | Intent |
|-----|--------|
| `semanticHtml` | Landmarks (`header` / `main` / `section` / `aside` as contracted) |
| `bemScreenId` | BEM root / classes use `screenId` |
| `dataStudioHooks` | `data-studio-react-screen` + make-retired mount gates |
| `uxdsKits` | Required kits (e.g. SearchField / ButtonPrimary per screen) |
| `noInventSeparators` | No invented filter/section separators vs Make |
| `dsStates` | Typical DS state matrix (hover/focus/…) via kit + ratchets |

Boots manifest: [../projects/boots-pharmacy/audits/PAGE_FINAL_PASS.json](../projects/boots-pharmacy/audits/PAGE_FINAL_PASS.json).

---

## Team check line (mandatory on page-close)

When closing a migrated page (or asking to open the next), Arch + callsigns report:

`PAGE FINAL PASS — <screenId> — HARD-GREEN | NOT-GREEN` (+ blocker one-liner if not).

**Knowledge used:** still mandatory per [TEAM.md](./TEAM.md) § Knowledge use.

---

## Related

- [NEXT_STEPS.md](./NEXT_STEPS.md) — erase-Make board + hard locks  
- [TEAM.md](./TEAM.md) · [TEAM_KNOWLEDGE.md](./TEAM_KNOWLEDGE.md)  
- [FE_UI_UX_AUDIT.md](./FE_UI_UX_AUDIT.md) · [UMA_FIDELITY_NOTES.md](./UMA_FIDELITY_NOTES.md) · [PARITY_RATCHETS.md](./PARITY_RATCHETS.md)
