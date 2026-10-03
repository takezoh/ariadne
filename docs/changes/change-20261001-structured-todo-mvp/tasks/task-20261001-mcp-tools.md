---
id: task-20261001-mcp-tools
kind: task
title: Authenticated Tools and Primary Skill
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
- {type: dependsOn, target: task-20261001-mcp-auth-spike}
- {type: dependsOn, target: task-20261001-core-contract}
- {type: dependsOn, target: task-20261001-firestore-store}
source_paths: []
change: change-20261001-structured-todo-mvp
summary: From Work conversations, capture/context/preview/apply/status/undo operate on the same source of truth as the UI.
done_criteria:
- From Work conversations, capture/context/preview/apply/status/undo operate on the same source of truth as the UI.
pinned_context:
- docs/changes/change-20261001-structured-todo-mvp/implementation.md
updated: '2026-10-03'
---

# T3: Authenticated Tools and Primary Skill

The current contract is in [implementation](../implementation.md) and [architecture-plan](../architecture-plan.json). Legacy Firestore/Cloud Run descriptions are not current contracts.

## Completion Criteria

From Work conversations, capture/context/preview/apply/status/undo operate on the same source of truth as the UI.

## Status

Scope completed on 2026-10-03. The [final Work acceptance record](../../../note/note-20261002-work-benefit-acceptance.md) documents deployment, measurements, post-fix regressions, and out-of-scope items. Requirements: FR01, FR02, FR07, FR12, FR13. Scenarios: S01, S02, S08, S09, S15, S16.
