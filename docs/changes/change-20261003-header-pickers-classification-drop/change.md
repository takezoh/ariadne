---
id: change-20261003-header-pickers-classification-drop
kind: change
title: Header creation, searchable pickers and reliable classification drops
status: active
created: '2026-10-03'
profile: sdd@1
intent: Consolidate creation and search, and make intentional mouse drops reliable
  and atomic.
outcomes:
- Header split Add and contextual filters remain accessible in narrow and full inspectors.
- Searchable Project/Tag pickers consolidate linking and inline creation without standalone
  New buttons.
- Native/pointer mouse and touch drops preserve geometry and classify selected Actions
  atomically.
scope:
- lib/ui/**
- lib/widget.ts
- lib/domain/core.ts
- app/mcp/route.ts
- tests/ui/**
- tests/domain/classification-batch.test.mjs
- tests/adapters/classification-batch.test.mjs
- scripts/testing/smoke-built-widget.mjs
- ARCHITECTURE.md
- docs/technical/data-model.md
- docs/technical/mcp-api.md
- docs/changes/change-20261003-header-pickers-classification-drop/**
non_goals:
- Database/schema changes, catalog dragging or deletion, deployment and arbitrary
  additive selection.
change_classes:
- behavior
- internal_design
governance:
  gate: auto
  reasons: []
members:
- role: requirements
  path: changes/change-20261003-header-pickers-classification-drop/requirements.md
  required: true
- role: implementation
  path: changes/change-20261003-header-pickers-classification-drop/implementation.md
  required: true
- role: verification
  path: changes/change-20261003-header-pickers-classification-drop/verification.md
  required: true
promotion: []
unresolved_decisions: []
tags: []
owners: []
relations: []
source_paths:
- lib/ui
- lib/widget.ts
- lib/domain/core.ts
- app/mcp/route.ts
- tests
- scripts/testing/smoke-built-widget.mjs
summary: Header split creation, fuzzy Project/Tag linking and geometry-stable atomic
  Action/catalog drag.
updated: '2026-10-03'
---

## Summary

Header creation, fuzzy classification pickers and geometry-stable atomic drops.

## Closure Notes

Native and final local integration acceptance are complete: 285 tests, lint, typecheck, build, both built resources and fresh narrow/full preview passed. Independent reviews approved. The structured closure transition is not expressible through the available scalar CLI path; status remains active with this completed local disposition recorded. No commit, push or deployment.


{% transition from="draft" to="ready" date="2026-10-03" %}
Observable contracts and native candidate verification are complete.
{% /transition %}


{% transition from="ready" to="active" date="2026-10-03" %}
Native acceptance passed; root final build and viewport gates are completing.
{% /transition %}
