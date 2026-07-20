# CJM = guitar tabs (Record / Play / Edit)

**Status:** Locked (PO 2026-07-21) · **Owners:** Arch · Bea · Finn · Quinn  
**See also:** [RECORDING.md](./RECORDING.md) · [PLAYBACK.md](./PLAYBACK.md) · [QA_LOGGING_AND_PLAYBACK_RECIPE.md](./QA_LOGGING_AND_PLAYBACK_RECIPE.md) · Traditional UX [TRADITIONAL_CJM_UX_2026-07-21.md](../projects/boots-pharmacy/audits/TRADITIONAL_CJM_UX_2026-07-21.md)

CJM is **not** an imperative director novel. It is a **tab script**: targets from the page fidelity pool + timing.

| Mode | Rule |
|------|------|
| **Record** | PO clicks the product page. Capture **stable targets** (`data-studio-action`, `data-studio-cal-*`, avail attrs, …) + `atMs` / dwell. REC only captures what page fidelity allows. |
| **Play** | Same engine plays those targets. **Continuous Play ≡ Step** (automated). No dump-all / skip-motion Play path. |
| **Edit** | PO gives a **user story**. Agent changes the script by **swapping targets / timing / order** on beats (`recordedClick.selectorChain`, `dwellMs`, beat order) — **not** rewriting `book.ts` / director prose. |

**Compile path:** REC events → `recordedClick` + `dwellMs` beats → same Play runners as Step.

**Prove helpers:** Agentic keep-overlay = `__studioRunAgenticFullPlayProve`. Traditional smoke = `__protoRunTraditionalPlaySmoke` (teardown); keep-overlay Traditional full prove = TBD.

## Camera engine rails

Same camera for agentic / traditional / REC — see [PLAYBACK.md](./PLAYBACK.md) § Scroll camera SSoT + **Camera engine rails**.

- Target-driven; no blind origin on screen-enter while CJM/play/AIR.
- `playbackScroll.ts` is SSoT — wire must not snap origin on tab change during session.
- Intentional origin (start/retreat/probe) uses `force: true` and honors post-click hold.

## Exceptions (deeper, keep thin)

- **Prebuilt chat / persona docks** — progressive frames, type-in, thinking camera. Prefer rails docs over inventing a second Play path. → [CHAT_PAGE_RAILS.md](../projects/boots-pharmacy/features/CHAT_PAGE_RAILS.md)
- **Prebuilt `bookScript` / `availScript` / `tabScript` directors** — still used by persona `journeys.ts`. Prefer **target resolution** (which cell + skip if already selected) over one-off force-click policies. Story-edits of **recorded** CJMs stay on `recordedClick` + dwell; do not require director surgery.

## Book Step 2 bridge (compatibility)

| Path | What plays |
|------|------------|
| **Recorded CJM** | Date/time clicks compile to unique `[data-studio-cal-kind=…][data-studio-cal-month=…][data-studio-cal-value=…]` (+ reserve `data-studio-action`). Edit = swap those selectors / dwell / order. |
| **Persona `bookScript`** | Director resolves primary **June 21 / 15:30**; if already selected (Avail handoff) → demo-change **June 24 / 16:30**. Never re-click the already-selected cell. Forward landing may `preserveHandoff`; step-back restores wire default. |

**Do not** invent new force-click policies that bypass the fidelity pool. Prefer under-match + declared targets.
