---
change: change-20261014-versioned-perspective-query
role: requirements
---

<!-- lifecycle is owned by change.md -->

# Requirements

## Outcomes

- Callers distinguish v1 `{definition_version:1, filter}` from v2 `{definition_version:2, query}` without runtime fallback. Query add/edit writes v2, metadata edits retain the current variant, v1 filter edits remain v1, mixed keys and v2 downgrade are rejected.
- V1 filtering retains existing defaults and byte-stable requests/receipts/deltas. V2 conditions, negative/set references, sorting, delete guards, feed projection and Undo use the shared query kernel and normal owner-scoped revision/receipt guarantees.
- The physical `filter` JSON column remains a storage-boundary detail. Migration accepts only versions 1 and 2 and preserves v1 rows and all other persisted history.
- API/MCP and UI expose the exact variant. The UI evaluates only the confirmed snapshot, shows both version summaries, globally renders explicit v2 order, excludes unmatched parents/local transients/creation reveals, and retains drafts and unknown exact requests.
- Migration and rollout guidance requires applying D1 migration 0017, switching to v2-capable readers, then allowing v2 writes. Old readers are unsafe after v2 rows, receipts or deltas exist.

## Constraints

- Keep `schemaVersion: 2`, owner trust boundary, D1 batch atomicity, CAS, identity reservations, retained history and existing action/catalog/association storage.
- Do not add a query editor, dedicated perspective controls, recommendation logic or hosted deployment work.
- Use the existing query kernel and production adapter path; fake-port tests supplement real SQLite adapter coverage.

## Source

Captured request: `takezoh/ariadne#27`, request hash `1701ed683d32be59bbc39e270ffdb0fec941db60e32a258f01a4d16d3d40c572`.
