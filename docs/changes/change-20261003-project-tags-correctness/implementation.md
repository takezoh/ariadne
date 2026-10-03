---
change: change-20261003-project-tags-correctness
role: implementation
---

<!-- lifecycle is owned by change.md -->

# Implementation

- Retain the identity ledger after deletion, keyed by owner, kind, and identity. A marker is the last owner revision at which each project/tag/task_tag changed; `catalog_revision` is used only for catalog-row generation/revision.
- Undo a change only when identity markers in its delta match the target receipt's `revision_after`. Report a conflict if a restored task's Project or a catalog parent/tag reference changed after the original revision. Read missing `project_id` in legacy task deltas as `null`, and protect each task_tag pair with its own marker.
- Validate creation input at the application boundary before generating server UUIDs. Reject new ID-bearing `project_add`/`tag_add`/legacy `structure` requests, but return an identical receipt retry first. Match Get-or-Create and structure refs to the feature package's acceptance criteria.
- Require key presence in `project_move`/`tag_move`/`task_project`; use explicit `null` to unlink. `queryResponse` rejects null Project/Tag filters, non-boolean `include_descendants`, and unknown keys.
- Preview returns descendants whose Project/Tag paths change and tasks whose `project_path`/`tags` projection changes. Mark new ID candidates `preview_only` and exclude internal ledger data from responses.
- Migration 0004 backfills the maximum revision from legacy receipt deltas for project/tag/task_tag. Treat active nodes after receipts without catalog arrays as marked at the owner revision; fail explicitly when adding the unique index if existing natural keys collide.
- Storage regression and shared-contract tests use memory/SQLite to verify owner isolation, CAS, receipt retries, missing responses, batch rollback, migration backfill, and identity Undo/ABA.
