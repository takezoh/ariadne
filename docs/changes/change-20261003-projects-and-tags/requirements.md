---
change: change-20261003-projects-and-tags
role: requirements
---

<!-- lifecycle is owned by change.md -->

# Requirements and acceptance criteria

The user requires hierarchical projects and tags, association with tasks and queries by parent including descendants through a thin API/MCP. Creating a UI, recommendations and deployment are out of scope.

- Store projects and tags in separate owner-scoped tables with stable IDs, local names and nullable `parent_id`. Paths are derived for display/input and do not define identity.
- Tasks can have zero or one project and multiple tags, as relationships separate from task parent-child. Project/tag hierarchies do not pass completion, Defer or tags to tasks.
- Queries by a parent project/tag may optionally include descendants. Return a task only once even when it matches multiple descendant tags.
- Reject cycles, missing parents, task associations to missing projects/tags and cross-owner references. Cross-owner references are excluded because snapshots are owner-scoped and cannot see another owner's rows.
- Reject deletion while child nodes or task references remain. Do not delete tasks.
- Preserve schemaVersion 2, owner isolation, atomic CAS, operation receipts, identical retries, safe Undo and existing C1-C4.
- Migrations must be additive and preserve existing rows; do not rebuild the database.
- Use the shared taskCall path for changes, associations and queries; do not implement separate state transitions per entry point. Add regression tests and dev-docs change records.

## Implementation contract and additional acceptance criteria

- Ariadne generates UUIDs for new task/project/tag/capture entities. `operationId` / `request_id` is a separate idempotency key. Atomically save generated/resolved entity IDs and `created` results under receipt `resolved`; identical retries and `operation_status` return the same values.
- Get-or-Create projects/tags by owner, parent and trimmed case-sensitive name. Do not Unicode-normalize; allow equal names under different parents. Reject natural-key collisions on rename/move and enforce uniqueness in the database. Do not merge duplicates during migration.
- In `structure_create`, each new task has a unique, nonempty ref. `parent_ref` may reference any task in the request. Existing tasks use `{id}` references; a dependency endpoint uses exactly one of `{ref}` or `{id}`. Do not bypass unknown-key validation by injecting internal UUIDs into caller payloads.
- Preview does not reserve IDs. Mark candidate IDs `preview_only:true` and preserve the payload and refs. Include descendants whose paths change for project/tag edits, but do not expose unrelated nodes or the identity ledger.
- Permanently reserve deleted project/tag UUIDs within the owner and never use them for ordinary creation. Undo checks target identity markers and the original receipt's `revision_after`, permits unrelated changes and rejects later changes to restore targets and task_tag ABA.
- For dropped tasks, allow unassigning a project and removing existing tags, but reject new project/tag associations.
- Additive migration 0004 backfills the maximum revision from old `operations.delta` project/tag/task_tag changes, including receipts without catalog arrays. On duplicate existing natural keys, fail the migration and preserve rows.
