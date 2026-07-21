# Documentation governance — lifecycle and authority

**Type:** Contract  
**Owner:** Arch (Director); Bea (BA) maintains decision and requirement traceability  
**Status:** Active  
**Last verified:** 2026-07-21  
**Current-status source:** [NEXT_STEPS.md](./NEXT_STEPS.md)

This contract keeps durable policy, live delivery status, evidence, and history from contradicting one another. It governs new documents and meaningful updates; it does not require a bulk metadata rewrite of the existing library.

## Document types and authority

| Type | Purpose | Authority / owner |
|------|---------|-------------------|
| **Doctrine / contract** | Durable rules, definitions, architecture, quality gates | Named owner; normative until superseded |
| **Living board / register** | Mutable priority, blockers, risks, or acceptance state | Named owner; [NEXT_STEPS.md](./NEXT_STEPS.md) alone owns current NOW/NEXT/completion |
| **Feature brief / parity register** | Scope, acceptance, source truth, residuals | Bea owns acceptance/register completeness; historical rows remain traceability |
| **Audit / proof** | Evidence observed at a version, SHA, URL, or date | Auditor owns the recorded result; evidence is immutable except corrections/addenda |
| **Guide / catalog** | Navigation and explanation | Owning domain; links to normative sources rather than duplicating them |
| **Decision ledger / lesson / retro** | Chronological rationale and learning | Append-only history; not a live backlog or current-status source |

When documents disagree, use this order for the disputed fact:

1. Evidence artifact for what was proven at its recorded point in time.
2. Doctrine/contract for the current rule or definition.
3. `NEXT_STEPS.md` for current priority, blocker, sequence, or completion.
4. Feature brief/register for scoped requirements and historical acceptance traceability.
5. Guide, forecast, decision ledger, lesson, or retro for context.

## Required identity block

New normative or living documents, and existing ones receiving a material rewrite, should identify:

```markdown
**Type:** Contract | Living board | Feature brief | Register | Audit | Guide | Decision ledger
**Owner:** <role or callsign>
**Status:** Draft | Active | Blocked | Proven | Retired | Historical
**Last verified:** YYYY-MM-DD
**Current-status source:** <link or N/A>
**Supersedes:** <link or N/A>
```

`Last verified` means the owner checked the document against its cited sources; it is not merely the edit date. Audit dates and proof SHAs must never be silently refreshed.

## Lifecycle rules

- **Draft → Active/Proven → Retired/Historical.** A retired document stays linkable when it carries useful history.
- A new rule that replaces an old one must state `Supersedes`, and the old document/section must point forward with `Superseded by`.
- Never delete or rewrite historical decisions to make the timeline look current. Add a routing note, status, correction, or superseding decision.
- Forecasts and briefs must link to `NEXT_STEPS.md`; they must not carry independent live “NOW/NEXT” truth.
- A parity register may retain kickoff-era `Missing` rows, but must label the snapshot and link current audit/Final Pass evidence. A newly discovered P0 reopens the live board and proof status.
- Copy a rule into a second document only when the reader needs the summary. Keep it to one sentence plus the normative link.

## Update trigger

Update the owning document in the same change when a durable rule, PO decision, acceptance criterion, blocker, or proof status changes. During review, ask:

1. What fact changed?
2. Which document type owns that fact?
3. Does any older statement need a `Superseded by`, historical label, or board update?
4. Is the evidence link still exact and reachable?

