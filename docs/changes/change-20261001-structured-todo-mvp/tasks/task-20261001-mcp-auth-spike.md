---
id: task-20261001-mcp-auth-spike
kind: task
title: Import Sites Verification Source and Connection Contract
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
source_paths: []
change: change-20261001-structured-todo-mvp
summary: Retrieve the recorded source commit and check its alignment with the existing Site/Plugin, source, dependencies, and migrations. Do not repeat every connection test.
done_criteria:
- Retrieve the recorded source commit and check its alignment with the existing Site/Plugin, source, dependencies, and migrations. Do not repeat every connection test.
pinned_context:
- docs/changes/change-20261001-structured-todo-mvp/implementation.md
updated: '2026-10-03'
---

# T0: Import Sites Verification Source and Connection Contract

The current contract is in [implementation](../implementation.md) and [architecture-plan](../architecture-plan.json). Legacy Firestore/Cloud Run descriptions are not current contracts.

## Completion Criteria

Retrieve the recorded source commit and check its alignment with the existing Site/Plugin, source, dependencies, and migrations. Do not repeat every connection test.

## Status

Scope completed on 2026-10-03. The [final Work acceptance record](../../../note/note-20261002-work-benefit-acceptance.md) documents deployment, measurements, post-fix regressions, and out-of-scope items. Requirements: FR01. Scenarios: S15, S16.
