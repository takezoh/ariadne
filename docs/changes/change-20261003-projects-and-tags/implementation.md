---
change: change-20261003-projects-and-tags
role: implementation
---

<!-- lifecycle is owned by change.md -->

# Implementation

Responsibility boundaries are documented in [Testing Design](../../technical/testing.md), storage and projections in [Data Model](../../technical/data-model.md), and entry point contracts in [MCP/API Contract](../../technical/mcp-api.md).

- Define project/tag/task_tag and the identity ledger in `db/schema.ts`, with natural-key constraints. Leave existing migrations 0002/0003 unchanged. In 0004, backfill identity markers from legacy receipt deltas and fail on duplicate natural keys instead of merging them.
- `lib/domain/core.ts` handles hierarchy paths/queries, natural-key validation, cancelled-task relationship restrictions, project/tag UUID reservations, and final-change markers for project/tag/task_tag as pure logic. `lib/domain/operations.ts` performs Undo using the target identity ledger and receipt `revision_after`, rejecting later changes to referenced identities and ABA. Preview includes descendant nodes whose path alone changes.
- `lib/application/task-service.ts` generates task/capture/project/tag UUIDs and exposes `add`, `capture_intent`, `project_get_or_create`/`tag_get_or_create`, and `structure_create` externally. New tasks in a structure convert local refs to internal UUIDs and store resolved IDs in receipts/results. Search receipts before validating or generating a new payload. Preview candidates are unreserved and return `preview_only`.
- `lib/adapters/d1-task-store.ts` reads the identity ledger from the snapshot and atomically saves state, ledger, and receipt in the existing owner-revision CAS/token-guard batch. The memory/SQLite shared contract checks the same results, ABA, and rollback behavior.
- `app/mcp/route.ts` and `skills/action-tools/SKILL.md` document UUID generation, Get-or-Create, structure refs, rejection of legacy kinds in new requests, retry receipts, and cancelled-task relationship restrictions. The shared UI is not created or edited in this change.
