---
id: change-20261003-classification-tree-inspector
kind: change
title: Classification trees and typed inspectors
status: active
created: '2026-10-03'
profile: sdd@1
intent: Let users browse catalog hierarchies and Actions together and edit the selected
  object directly.
outcomes:
- Projects and Tags use a hierarchical catalog-and-Action outline instead of a classification
  dropdown.
- Typed inspectors autosave Action fields or catalog Name and Description with exact
  recovery.
- Repeated Tag occurrences retain contiguous range selection without duplicating Action
  writes.
scope:
- lib/ui/**
- lib/widget.ts
- tests/ui/**
- scripts/testing/smoke-built-widget.mjs
- ARCHITECTURE.md
- docs/technical/data-model.md
- docs/technical/mcp-api.md
- docs/changes/change-20261003-classification-tree-inspector/**
non_goals:
- Backend, storage, migrations, catalog drag/delete and deployment.
change_classes:
- behavior
- internal_design
governance:
  gate: auto
  reasons: []
members:
- role: requirements
  path: changes/change-20261003-classification-tree-inspector/requirements.md
  required: true
- role: implementation
  path: changes/change-20261003-classification-tree-inspector/implementation.md
  required: true
- role: verification
  path: changes/change-20261003-classification-tree-inspector/verification.md
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
summary: Projects and Tags share a catalog-and-Action outline with typed minimal autosave
  inspectors.
updated: '2026-10-03'
---

## Summary

A shared classification-and-Action outline with typed minimal inspectors.

## Closure Notes

Local implementation and integration acceptance completed: 269 tests, lint/typecheck, build, both built resources, fresh preview, final browsers and native independent review passed. No commit, push or deployment. The package remains structurally active because the CLI scalar patch interface cannot represent structured closure disposition; this documentation lifecycle limitation is not pending implementation. Native Profile execution does not claim development-loop kernel execution.


{% transition from="draft" to="ready" date="2026-10-03" %}
Observable tree and typed inspector contracts are verified by the native implementation candidate.
{% /transition %}


{% transition from="ready" to="active" date="2026-10-03" %}
Native reviews passed; root integration gates are in progress.
{% /transition %}
