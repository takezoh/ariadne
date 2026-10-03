---
id: task-20261001-firestore-store
kind: task
title: D1 Migration, Revisions, Receipts, History, and BUG-01 Fix
status: done
created: '2026-10-01'
priority: normal
effort: medium
files_touched: []
pr: null
tags: []
owners: []
relations:
- {type: partOf, target: change-20261001-structured-todo-mvp}
- {type: dependsOn, target: task-20261001-core-contract}
- {type: dependsOn, target: task-20261001-mcp-auth-spike}
source_paths: []
change: change-20261001-structured-todo-mvp
summary: Prevent partial writes with conditional batches, reject reuse of an ID with different input, preserve existing data, and verify BUG-01 regression in Work.
done_criteria:
- Prevent partial writes with conditional batches, reject reuse of an ID with different input, preserve existing data, and verify BUG-01 regression in Work.
pinned_context:
- docs/changes/change-20261001-structured-todo-mvp/implementation.md
updated: '2026-10-03'
---

# T2: D1 Migration, Revisions, Receipts, History, and BUG-01 Fix

The current contract is in [implementation](../implementation.md) and [architecture-plan](../architecture-plan.json). Legacy Firestore/Cloud Run descriptions are not current contracts.

## Completion Criteria

Prevent partial writes with conditional batches, reject reuse of an ID with different input, preserve existing data, and verify BUG-01 regression in Work.

## Status

Scope completed on 2026-10-03. The [final Work acceptance record](../../../note/note-20261002-work-benefit-acceptance.md) documents deployment, measurements, post-fix regressions, and out-of-scope items. Requirements: FR02, FR03, FR11, FR12, FR13. Scenarios: S02, S04, S14, S15, S16.
