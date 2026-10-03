---
change: change-20261003-project-tags-correctness
role: requirements
---

<!-- lifecycle is owned by change.md -->

# Requirements and Acceptance Criteria

This active correction package clarifies the safe identity, Undo, and compatibility contract for Projects/Tags. Keep the feature package (`change-20261003-projects-and-tags`) incomplete and do not treat this package as completed history.

- Callers do not supply IDs for new tasks/projects/tags/captures; Ariadne generates UUIDs. Deleted project/tag UUIDs remain reserved per owner and are not reused by ordinary creation. Only Undo of the same receipt can restore the original UUID.
- `operationId`/`request_id` is an idempotency key separate from entity IDs, and resolved IDs are stored in the receipt. Retries of the same request and `operation_status` return the same entity ID; different input is rejected.
- Project/Tag Get-or-Create uses owner, parent, and the trimmed, case-sensitive name as its natural key. Duplicate rename/move is rejected by the domain and database; migration fails rather than merging existing duplicates.
- New tasks in `structure_create` use unique local refs; existing tasks use ID references. Validation completes before internal IDs are added to the caller payload.
- Undo compares project/tag/task_tag identity markers in the delta with the original receipt's `revision_after`, rather than rejecting every change based on the owner-wide revision. Task_tag ABA and later changes to restored references result in `undo_conflict`.
- Legacy task deltas from before migration that lack `project_id` can be undone if there were no later changes. If the current task has a later Project relationship, protect it with `undo_conflict`.
- Migration 0004 backfills the maximum identity revision from legacy receipt deltas for projects/tags/task_tags, including legacy receipts without catalog arrays and active rows.
- `parent_id` in `project_move`/`tag_move` and `project_id` in `task_project` are required keys; a missing key must not silently unlink. Use explicit `null` to unlink.
- `query_tasks` rejects explicit null for `project_id`/`tag_id`, and rejects null or non-boolean `include_descendants`. Shared exact-key validation rejects unknown keys.
- `preview_change` includes descendant Projects/Tags whose path alone changes in affected results, and excludes unrelated nodes and internal ledger data. Generated candidates are `preview_only`.
- A cancelled task may only be unassigned from a Project or have an existing Tag removed; reject new assignments and added Tags.
- Verify owner isolation, CAS/rollback, identical retries, missing responses, identity Undo, and ABA for A/B owners in the same database and through the shared port contract (memory/SQLite).
