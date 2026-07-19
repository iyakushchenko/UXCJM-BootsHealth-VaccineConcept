# Feature brief — Home React migration

**Project:** `boots-pharmacy`  
**Callsigns:** Bea (BA) · Finn (FE) · Uma (UI/UX) · Quinn (QA) · Pax (PO sim) · Arch (Director)  
**Status:** building (first visible mount)  
**Updated:** 2026-07-19  
**Refs:** [HOME_MAKE_PARITY_REGISTER.md](./HOME_MAKE_PARITY_REGISTER.md) · [NEXT_STEPS.md](../../../product/NEXT_STEPS.md) erase-Make · Uma [../audits/UMA_FIDELITY_HOME_2026-07-19.md](../audits/UMA_FIDELITY_HOME_2026-07-19.md)

---

## Context

Erase-Make sequence: PLP → PDP (**PAGE FINAL PASS HARD-GREEN**) → **Home** (PO `+` 2026-07-19). Agentic Site Pilot Home (`screenId: home`, Frame child **11**) is the NL entry before Chat. Mount pattern matches PLP/PDP: React + UXDS, Make retired from view, no LEGACY growth, URL + recording.

## Business logic

| Rule | Behavior |
|------|----------|
| Default query | Sarah SE Asia travel intent prefilled |
| Send | → Site Pilot Chat (`screen=chat`) |
| Suggested chips | → Chat (same as Make wire) |
| Logged-in heading | “Sarah, what health services…” via `isStudioLoggedIn` SSoT |
| Reset / dirty | Hide Reset while query === default (wire parity — follow-up) |
| Footer / crumbs | None — do not invent |

## Acceptance (Bea → Quinn)

- [x] React host mounts at child 11; Make retired (`data-studio-make-retired=home`)
- [x] Make wire effects early-return when React mounted
- [x] URL `?project=boots-pharmacy&screen=home`
- [x] No LEGACY growth for React path
- [ ] Uma audit **PROVEN** (currently IN PROGRESS)
- [ ] Quinn MCP full matrix PASS (stub `home-host` only for now)
- [ ] Honest residual documented
- [ ] PAGE FINAL PASS hard-green (later — do not stamp early)

## Chrome / fidelity (Uma)

- [ ] Concept L&F vs Make Body10 (logo, card shadow/radius, chips, atmos)
- [ ] Typical DS checks: mic · send · chips · textarea
- [ ] No invent footer / crumbs / Advantage / PromoMessageStrip
- [ ] Auth heading parity

## Mount / FE notes (Finn)

- Folder = `screenId`: `src/projects/boots-pharmacy/screens/home/`
- Contract: `HOME_CHILD_INDEX = 11`, `HOME_REACT_SCREEN_ID = "home"`
- Mount: `mountHomeScreen` / deferred unmount — hide Make children; keep header mount
- Auth: `loggedIn: resolveAgenticHomeLoggedIn(loggedInFlag)` → `isStudioLoggedIn`
- Reuse: Accordion / PromoMessageStrip / TertiaryCta = **N/A** on Home Make

## Prove notes (Quinn)

- Stub: `__studioRunMcpPageProbe({ screenId:"home", reload:false })` — `home-host` + overlay-arm + url-screen
- R11: `http://localhost:5173/` reuse tab only
- Criteria: [../audits/QUINN_HOME_PROBE_CRITERIA_2026-07-19.md](../audits/QUINN_HOME_PROBE_CRITERIA_2026-07-19.md)

## Pax

- [ ] User-visible? → bump patch? **Y** when fidelity ship closes (not this interim scaffold alone unless PO wants)
- [ ] Push? **Y** interim kickoff
- [ ] Notes/CHANGELOG updated
