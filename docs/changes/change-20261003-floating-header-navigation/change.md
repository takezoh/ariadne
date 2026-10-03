---
id: change-20261003-floating-header-navigation
kind: change
title: Floating header navigation and display menus
status: active
created: '2026-10-03'
profile: sdd@1
intent: Make view navigation and display settings directly accessible in a compact
  header.
outcomes:
- Current function name and icon open one floating navigation menu.
- Contextual display choices use a checked popup and Refresh is icon-only.
- Add Project and Tag open the matching tree with inline creation without losing proposals.
scope:
- lib/ui/adapters/dom.js
- lib/widget.ts
- lib/ui/icons.ts
- tests/ui/dom.test.mjs
- scripts/testing/smoke-built-widget.mjs
- ARCHITECTURE.md
- docs/changes/change-20261003-floating-header-navigation/**
non_goals:
- Backend contracts, catalog semantics, deployment or changes to movement behavior.
change_classes:
- behavior
- internal_design
governance:
  gate: auto
  reasons: []
members:
- role: requirements
  path: changes/change-20261003-floating-header-navigation/requirements.md
  required: true
- role: implementation
  path: changes/change-20261003-floating-header-navigation/implementation.md
  required: true
- role: verification
  path: changes/change-20261003-floating-header-navigation/verification.md
  required: true
promotion: []
unresolved_decisions: []
tags: []
owners: []
relations: []
source_paths:
- lib/ui/adapters/dom.js
- lib/widget.ts
- lib/ui/icons.ts
- tests/ui/dom.test.mjs
- scripts/testing/smoke-built-widget.mjs
- ARCHITECTURE.md
summary: Consolidate view navigation and display options in a compact header, with
  contextual catalog creation.
updated: '2026-10-03'
---

## Summary

Floating header navigation replaces the sidebar and mobile view selector.

## Closure Notes

Final local integration is complete: 305 tests, lint/typecheck, build, both built resources, independent reviews, fresh read-only preview at three widths and twelve trusted native cases from actually served HTML passed. Status remains active because the available scalar CLI does not express structured closure disposition; completed local acceptance is recorded here. No commit, push or deployment.


{% transition from="draft" to="ready" date="2026-10-03" %}
Native UI implementation and independent review approved; whole check passed.
{% /transition %}


{% transition from="ready" to="active" date="2026-10-03" %}
Native implementation and independent acceptance complete; final build and served artifact gates running.
{% /transition %}
