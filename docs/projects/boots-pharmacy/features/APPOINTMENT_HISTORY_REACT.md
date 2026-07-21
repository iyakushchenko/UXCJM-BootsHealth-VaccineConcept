# Appointment History — React migration brief

**Status:** NEXT · discovery complete · implementation not yet PAGE FINAL PASS  
**Sequence:** Appointment History first; Appointment Details cannot start until History is hard-green.  
**Routes:** `screen=appointment-history` → `screen=appointment-details`

## Product contract

- Replace the remaining Make child for Appointment History with a project-scoped React + UXDS screen.
- Preserve `data-studio-action="appointment-history-view-details"` and the existing Agentic/Traditional director handoff.
- Keep account/auth truth on the engine `studioAuthSession` SSoT; no page-local auth flag.
- Retire the Make mount only after visual, interaction, URL, continuous Play, Step Forward, retreat, and PAGE FINAL PASS evidence is green.
- Loading/empty/updating states and keyboard/focus behavior are required—not deferred polish.

## Token-saving proof contract

One QA evidence pack must contain the History landing, View Details click, Details navigation, raw PLAYBACK_DIAG tail, human QA row, selector/action metadata, and parity verdict. Agents should consume the pack summary before opening raw event arrays.

## Gate

Appointment Details migration remains closed until History passes `check:page-final-pass` and a strict FE/UI/UX audit is PROVEN.
