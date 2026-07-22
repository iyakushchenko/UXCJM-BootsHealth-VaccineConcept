# Agent-driven recording

**Status:** operational playbook. Manual REC, visible agent driving, MCP helpers, Add-as-CJM, and exact recorded playback are shipped. Automatic CJM derivation from arbitrary research artifacts remains assisted rather than a standalone product feature.

Cross-link: [RECORDING.md](./RECORDING.md) (shipped capture / replay / compile).

---

## Intent

When the PO wants a new CJM without hand-driving every click:

1. PO provides a **link to persona artifacts** (research, journey maps, design files, brief docs, etc.).
2. The agent **derives a CJM** from those artifacts (touchpoints, screens, decisions, CTAs).
3. The agent **creates a recording** of that CJM on **pages already available** in the Studio project (`?project=` / `?screen=`).
4. If a needed page/screen is **not mounted yet**, the agent must **stop inventing UI** and report that **UX CONCEPT(s) will be required**, naming them explicitly.

---

## Agent playbook (hard process)

Before recording, the agent MUST:

1. Reuse the existing `http://localhost:5173/` tab and run **ALWAYS CLEAR**.
2. Arm via `__studioArmRecCapture()` and assert `__studioAssertRecLive().ok === true`.
3. Drive every click through `__studioSimulateDemoPointerClick`; silent protocol `.click()` is forbidden.
4. Move at capable-human pace: normal pointer travel plus short reaction gaps; ≥2s only for an intentional scroll-stop/camera pause.
5. Treat every open modal as blocking navigable state; finish or close it before acting behind it.
6. Never target an already-selected date/time/tab/radio. Choose another meaningful option or omit the no-op.
7. Stop immediately on `false`, ghost target, unchanged stateful control, cursor miss, blocked modal, or QA alarm. Do not continue and do not save a broken event.
8. Stop REC, give the CJM a semantic human journey name, save it, then play **that exact new `rec-*` journey**. PASS requires exact peak, zero click failures/skips, and clean reset.

This process is engine-wide. Do not add a journey-id/persona/route-order exception to make one recording pass.

### Inputs (PO)

| Input | Notes |
|-------|--------|
| Persona artifact link(s) | Research pack, journey PDF/FigJam, design file, brief |
| Target project | e.g. `boots-pharmacy` |
| Path flavor | Agentic vs Traditional (or new free CJM) |
| Accept / reject | Product call on derived CJM + recording quality |

### Steps

1. **Ingest artifacts** — read the linked persona materials; extract goals, steps, screens, and decision points.
2. **Draft CJM** — propose beats / touchpoints aligned with Studio URL screens (`screenId` = folder name). Prefer existing screens in the project registry.
3. **Gap check (HARD)** — for each draft beat, resolve whether the screen exists in the Studio project wire:
   - **Available** → include in the recording plan.
   - **Missing** → do **not** fake the page. List required concepts:
     - `UX CONCEPT 1: <Concept name>`
     - `UX CONCEPT 2: <Concept name>`
     - …
4. **Record on available pages** — only when CREATE NEW CJM (or equivalent new path) is selected; use REC start → interact → Stop → Add as CJM (or MCP recording APIs). Stay on `http://localhost:5173/` (fixed localhost rule).
5. **Hand back** — recording JSON / new CJM label + any **UX CONCEPT** gap list. PO accepts or rejects.

### Output contract (when gaps exist)

```text
Derived CJM: <title>
Recorded on available screens: <screenId…>
UX CONCEPT(s) will be required:
  1. <Concept name>
  2. <Concept name>
  3. <Concept name>
Blocked beats (not recorded): <brief list>
```

Honesty rule: under-match over invent. No invented hover, loaders, or screens not in the project / concept pack.

---

## What is shipped today (do not over-claim)

| Capability | Today |
|------------|--------|
| Manual REC deck + STEPS | Yes — [RECORDING.md](./RECORDING.md) |
| Download `.recording.json` / Add as CJM | Yes |
| Export selected saved journey JSON (Download on saved CJM) | Yes (control-room Download) |
| MCP `__studioStartRecording` / export / import | Yes |
| Auto-derive CJM from persona artifact links | **No** — this playbook |
| Agent-driven REC on available screens with visible shared cursor | **Yes** |
| Auto-record full CJM across missing screens | **No** — blocked by UX CONCEPT gap report |

---

## Related

- [RECORDING.md](./RECORDING.md) — capture, replay, compile
- [PLAYBACK.md](./PLAYBACK.md) — journey engine
- [URL.md](./URL.md) — `project` / `screen` / `experience` / `cjm`
- [CONCEPT_INTAKE.md](../product/CONCEPT_INTAKE.md) — bringing new UX concepts into Studio
