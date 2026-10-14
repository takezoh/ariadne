---
id: change-20261014-versioned-perspective-query
kind: change
title: Versioned perspective query integration
status: draft
created: '2026-10-14'
profile: sdd@1
intent: Persist strict v1 filter and v2 structured-query perspective variants; evaluate
  both consistently across storage, APIs and the shared UI.
outcomes:
- V1 filters and v2 queries persist, validate, replay and undo as exact variants under
  existing owner-scoped revision guarantees.
- V2 queries can globally sort confirmed matches while v1 and omitted v2 sorts retain
  existing action order.
- Migration and release guidance preserve existing rows and retained history while
  requiring v2-capable readers before v2 writes.
scope:
- lib/
- app/mcp/route.ts
- db/
- drizzle/
- tests/
- scripts/testing/verify-worker-d1.mjs
- docs/technical/
- docs/design/design-action-state-and-perspectives.md
- docs/design/assistance.md
- docs/changes/change-20261014-versioned-perspective-query/
- ARCHITECTURE.md
- skills/action-tools/
non_goals:
- Dedicated perspective query editor
change_classes:
- behavior
- boundary
- invariant
governance:
  gate: auto
  reasons: []
members:
- role: requirements
  path: changes/change-20261014-versioned-perspective-query/requirements.md
  required: true
- role: implementation
  path: changes/change-20261014-versioned-perspective-query/implementation.md
  required: true
- role: verification
  path: changes/change-20261014-versioned-perspective-query/verification.md
  required: true
promotion: []
unresolved_decisions: []
tags: []
owners: []
relations:
- {type: modifies, target: design-action-state-and-perspectives}
source_paths: []
summary: Add persisted v2 query definitions while retaining strict v1 semantics, shared
  evaluation and safe rollout sequencing.
---

## Summary

## Closure Notes
