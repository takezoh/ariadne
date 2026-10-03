---
change: change-20261003-project-tags-correctness
role: verification
---

<!-- lifecycle is owned by change.md -->

# Verification Record

This record documents test results for the current identity UUID/ledger contract. Independent review is separate; this document does not replace it.

## Completed Boundary Tests

| Check | Result |
| --- | --- |
| `pnpm test:domain` | 19/19 passed. Includes identity reservation, Undo based on receipt revision, legacy deltas, task_tag ABA, cancelled tasks, and path-only preview. |
| `pnpm test:application` | 7/7 passed. Includes server UUIDs, caller ID rejection, prevention of generation before input validation, Get-or-Create, structure refs, preview_only, generation-collision retry, and resolved IDs from operation_status. |
| `pnpm test:storage` | 53/53 passed. Includes owner isolation, CAS, retries, missing responses, rejection of stale Undo after Project restoration, and task_tag ABA in the memory/SQLite shared contract. SQLite verified migration backfill, unique-key collision, and rollback of CAS/catalog rows/ledger when receipt creation fails. |
| `docs lint` | Indexed 29 documents with 0 warnings. |
| `pnpm check` | Passed. Lint, typecheck, and 113/113 tests passed; 0 failed, cancelled, skipped, or TODO. |
| `pnpm build` | Passed. All five stages of the vinext production build completed. |
| `docs lint` | Indexed 29 documents with 0 warnings (rerun after the final update). |
| `docs lint --conformance` | Resolved duplicate design ownership in `skills/action-tools/SKILL.md`. Two existing issues remain: missing closure evidence_refs and promotion records in the MVP change. |
| Independent review | Sol low approved, no findings. The deep-freeze probe for the exported pure helper also passed. |

The legacy receipt migration fixture verified the maximum `revision_after` for each projects/tags/task_tags identity, retention of deleted IDs, and fallback markers for active rows after legacy receipts without catalog arrays. The natural-key collision fixture made migration 0004 fail and verified that both existing Project rows remained.

## Limitations

- Production D1, Sites auth injection, and ChatGPT Work on-device were not tested. SQLite fixture success does not mean production D1 migration is complete.
- `pnpm db:migrate:local` and `pnpm test:ui:built` were not run. UI authoring, deployment, commit, and push are out of scope.
- This is implementation verification, not the independent review verdict.
