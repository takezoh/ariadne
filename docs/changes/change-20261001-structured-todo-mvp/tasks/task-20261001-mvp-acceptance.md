---
id: task-20261001-mvp-acceptance
kind: task
title: Integration and Personal Trial
status: done
created: '2026-10-01'
updated: '2026-10-03'
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
- {type: dependsOn, target: task-20261001-mcp-tools}
- {type: dependsOn, target: task-20261001-todo-ui}
source_paths: []
change: change-20261001-structured-todo-mvp
summary: Measure in Work the in-scope S01–S16 features, BUG-01/02, timeout, and retry behavior. Separate-account, infrastructure-only, CSP, and cost checks are not completion criteria.
done_criteria:
- Measure in Work the in-scope S01–S16 features, BUG-01/02, timeout, and retry behavior. Separate-account, infrastructure-only, CSP, and cost checks are not completion criteria.
pinned_context:
- docs/changes/change-20261001-structured-todo-mvp/implementation.md
---

# T5: Integration and Personal Trial

The current contract is in [implementation](../implementation.md) and [architecture-plan](../architecture-plan.json). Legacy Firestore/Cloud Run descriptions are not current contracts.

## Completion Criteria

Measure in Work the in-scope S01–S16 features, BUG-01/02, timeout, and retry behavior. Separate-account, infrastructure-only, CSP, and cost checks are not completion criteria.

## Status

Scope completed on 2026-10-03. The [final Work acceptance record](../../../note/note-20261002-work-benefit-acceptance.md) documents deployment, measurements, post-fix regressions, and out-of-scope items. Requirements: FR01, FR02, FR03, FR04, FR05, FR06, FR07, FR08, FR09, FR10, FR11, FR12, FR13, FR14, FR15. Scenarios: S01–S16.
