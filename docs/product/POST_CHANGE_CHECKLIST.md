# Post-change checklist (UX Studio)

**Status:** Lean spine — 2026-07-19  
**Inspired by:** Summarizer `.cursor/rules/post-change-checklist.mdc` (full gate suite)  
**Rule of thumb:** Local gates first; do not burn GitHub Actions to discover breakage.

---

## After code / UI / config changes

Complete before calling the task **done** (including late in a long session):

1. **`npm test`** — static contracts (e.g. `check:links`) + Vitest. Fix failures.
2. **`npm run build`** — Vite production build must stay green (same signal Pages uses).
3. **Behavior / docs** — if product behavior changed, update the matching `docs/product/*` or project README the same turn.
4. **UI-facing handoff** — run strict FE audit per [FE_UI_UX_AUDIT.md](./FE_UI_UX_AUDIT.md) until **PROVEN** (doctrine §7). Green tests alone are not enough.
5. **Interactive / chrome / playback** — prefer local MCP / browser helpers (`window.__protoRunMcpSanityCheck`, lean `npm run smoke` against `npm run dev`). Full marathon (`PROTO_SMOKE_PROFILE=full`) only when investigating, not by default.
6. **Changelog** — if the change is user-visible or a durable engine seam, append a note:  
   `npm run notes:append -- --lane=<lane> --intent="…"`  
   See [VERSIONING.md](./VERSIONING.md).
7. **Commit** when the tree is coherent and the user allows (or doctrine seam rules apply). Do not leave a green coherent tree uncommitted without a reason.

---

## Do not

- Add CI jobs to replace steps 1–5.
- Run `PROTO_SMOKE_PROFILE=full` in GitHub Actions.
- Skip FE audit because “tests passed.”

---

## Related

- [CI_ACTIONS_BUDGET.md](./CI_ACTIONS_BUDGET.md)  
- [VERSIONING.md](./VERSIONING.md)  
- [COMMAND_DOCTRINE.md](./COMMAND_DOCTRINE.md) §6–§7  
- [../../AGENTS.md](../../AGENTS.md)  
