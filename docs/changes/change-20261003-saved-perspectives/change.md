---
id: change-20261003-saved-perspectives
kind: change
title: Owner-scoped filter-only perspectives
status: active
created: '2026-10-03'
profile: sdd@1
intent: Persist reusable owner-scoped views containing extraction conditions only,
  preserving action order and operation guarantees.
outcomes:
- Owner-scoped perspective definitions support CRUD, preview and current-state evaluation.
- Filters preserve action-tree order without copying or mutating actions.
- Additive migration and atomic storage preserve revision, replay, Undo and owner
  isolation.
scope:
- lib/
- app/mcp/route.ts
- db/
- drizzle/
- tests/
- docs/technical/
- docs/changes/change-20261003-saved-perspectives/
- docs/design/design-action-state-and-perspectives.md
- ARCHITECTURE.md
- skills/action-tools/SKILL.md
- README.md
- PRODUCT.md
non_goals:
- Perspective-specific order, grouping or display settings
- Dedicated perspective UI controls
- Recommendation engine, prerequisite edges or new action attributes
- Hosted migration, deployment, data reset, commit or push
change_classes:
- behavior
- boundary
- invariant
governance:
  gate: auto
  reasons: []
members:
- role: requirements
  path: changes/change-20261003-saved-perspectives/requirements.md
  required: true
- role: implementation
  path: changes/change-20261003-saved-perspectives/implementation.md
  required: true
- role: verification
  path: changes/change-20261003-saved-perspectives/verification.md
  required: true
promotion: []
unresolved_decisions: []
tags: []
owners: []
relations:
- {type: modifies, target: design-action-state-and-perspectives}
source_paths:
- lib/domain/core.ts
- lib/domain/operations.ts
- lib/application/action-service.ts
- lib/adapters/d1-action-store.ts
- db/schema.ts
- app/mcp/route.ts
summary: Save and evaluate filter-only owner views against the current action state.
updated: '2026-10-03'
---

# Owner-scoped filter-only perspectives

The user defines a perspective as a View of the existing action state. It stores extraction conditions only, with an explicit owner boundary and no override of action order. The current action model is based on main b9c3218. The user explicitly requests native Codex implementation and independent review after external delegation was rejected.

A saved perspective never copies actions, changes lifecycle/Defer/Flag, or treats sibling order as an availability restriction. Reads evaluate the latest state and explicit read time.

## Delivery boundary

This change adds data-layer/API support and host contract descriptions. It does not add dedicated perspective UI controls or execute hosted migrations/deployment. Migration 0010 preserves existing action/catalog data and receipts; the authorized reset in historical 0009 is not authorization for any further reset.
