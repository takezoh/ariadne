---
id: change-20261003-direct-action-movement
kind: change
title: Direct action status, classification and movement
status: active
created: '2026-10-03'
profile: sdd@1
intent: Expose minimal direct status and classification controls and atomic accessible
  list movement.
outcomes:
- Named status icons above Title and existing Project/Tag assignment save directly
  without Parent/Order text inputs.
- Orange Flag and accessible pointer/touch/keyboard selection and movement preserve
  canonical bundle and containment semantics.
- One action_move uses full hidden structure and existing atomic CAS/receipt/Undo
  with exact unknown recovery.
scope:
- lib/ui/**
- lib/widget.ts
- lib/domain/core.ts
- app/mcp/route.ts
- tests/ui/**
- tests/domain/action-move.test.mjs
- tests/adapters/action-move-store.test.mjs
- scripts/testing/smoke-built-widget.mjs
- ARCHITECTURE.md
- docs/technical/data-model.md
- docs/technical/mcp-api.md
- docs/changes/change-20261003-direct-action-movement/**
non_goals:
- No catalog CRUD, execution dependencies, invented dates, membership inheritance,
  schema migration, dependencies or deployment.
change_classes:
- behavior
- internal_design
governance:
  gate: auto
  reasons: []
members:
- role: requirements
  path: changes/change-20261003-direct-action-movement/requirements.md
  required: true
- role: implementation
  path: changes/change-20261003-direct-action-movement/implementation.md
  required: true
- role: verification
  path: changes/change-20261003-direct-action-movement/verification.md
  required: true
promotion: []
unresolved_decisions: []
tags: []
owners: []
relations:
- {type: conformsTo, target: design-action-state-and-perspectives}
source_paths: []
updated: '2026-10-03'
summary: Direct status icons, Project/Tags settings, orange Flag and atomic single/batch
  action movement.
---

## Summary

Direct minimal Action details and one atomic accessible bundle movement.

## Closure Notes

Local implementation and integration acceptance completed: 258 tests, build, both built resources, browser/recovery and native independent review passed. No commit, push or deployment. The package remains structurally active because the CLI scalar patch interface cannot represent structured closure disposition; this is a documentation lifecycle limitation, not pending implementation. Native Profile execution does not claim development-loop kernel execution.
