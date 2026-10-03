---
id: change-20261003-tree-outdent-catalog-movement
kind: change
title: Tree outdent and catalog movement
status: active
created: '2026-10-03'
profile: sdd@1
intent: Make tree movement direct and durable without a separate drop region.
outcomes:
- Actions outdent through visible tree row edges.
- Projects retain sibling order and parent changes.
- Tags change parents without sibling-order semantics.
scope:
- lib/ui/**
- lib/widget.ts
- tests/ui/**
- scripts/testing/smoke-built-widget.mjs
- ARCHITECTURE.md
- lib/domain/core.ts
- lib/domain/operations.ts
- lib/adapters/d1-action-store.ts
- db/schema.ts
- drizzle/0013_project_order.sql
- drizzle/meta/_journal.json
- drizzle/meta/0013_snapshot.json
- tests/helpers/sqlite-d1.mjs
- app/mcp/route.ts
- docs/technical/mcp-api.md
- docs/technical/data-model.md
- tests/domain/project-move.test.mjs
- tests/adapters/project-move.test.mjs
- tests/adapters/catalog-description.test.mjs
- tests/adapters/action-model-migration.test.mjs
- tests/adapters/perspective-migration.test.mjs
- tests/domain/action-move.test.mjs
- docs/changes/change-20261003-tree-outdent-catalog-movement/**
non_goals:
- Tag ordering, catalog multiselection, membership inference, deployment and data
  resets.
change_classes:
- behavior
- internal_design
- boundary
governance:
  gate: auto
  reasons: []
members:
- role: requirements
  path: changes/change-20261003-tree-outdent-catalog-movement/requirements.md
  required: true
- role: implementation
  path: changes/change-20261003-tree-outdent-catalog-movement/implementation.md
  required: true
- role: verification
  path: changes/change-20261003-tree-outdent-catalog-movement/verification.md
  required: true
promotion: []
unresolved_decisions: []
tags: []
owners: []
relations: []
source_paths:
- lib/ui
- lib/widget.ts
- tests/ui
- scripts/testing/smoke-built-widget.mjs
summary: Tree-edge outdent without separate drop space, durable Project movement and
  Tag parenting.
updated: '2026-10-03'
---

## Summary

Tree edge indentation replaces the separate root drop region. Typed catalog movement preserves Action membership.

## Closure Notes

Final local integration is complete: 299 tests, lint/typecheck, build, both built resources, populated migration preservation, exact native movement and fresh narrow/full read-only preview passed. Independent native reviews approved. The available scalar closure CLI does not express structured closure disposition, so status remains active with completed local acceptance recorded here. No commit, push or deployment.


{% transition from="draft" to="ready" date="2026-10-03" %}
Independent boundary approved; native implementation and targeted acceptance complete.
{% /transition %}


{% transition from="ready" to="active" date="2026-10-03" %}
Native implementation complete; final local integration gates running.
{% /transition %}
