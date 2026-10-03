---
id: task-20261001-todo-ui
kind: task
title: List, Detail, Defer, and Correction
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
- {type: dependsOn, target: task-20261001-mcp-tools}
source_paths: []
change: change-20261001-structured-todo-mvp
summary: Work list/detail/Defer/Undo, dirty-draft preservation, and unknown-result display. Verify BUG-02 regression in Work.
done_criteria:
- Work list/detail/Defer/Undo, dirty-draft preservation, and unknown-result display. Verify BUG-02 regression in Work.
pinned_context:
- docs/changes/change-20261001-structured-todo-mvp/implementation.md
updated: '2026-10-03'
---

# T4: List, Detail, Defer, and Correction

The current contract is in [implementation](../implementation.md) and [architecture-plan](../architecture-plan.json). Legacy Firestore/Cloud Run descriptions are not current contracts.

## Completion Criteria

Work list/detail/Defer/Undo, dirty-draft preservation, and unknown-result display. Verify BUG-02 regression in Work.

## Status

Scope completed on 2026-10-03. The [final Work acceptance record](../../../note/note-20261002-work-benefit-acceptance.md) documents deployment, measurements, post-fix regressions, and out-of-scope items. Requirements: FR07, FR14, FR15. Scenarios: S03, S05, S06, S07, S08, S09, S12, S13, S14, S15.
