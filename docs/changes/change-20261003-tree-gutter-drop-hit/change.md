---
id: change-20261003-tree-gutter-drop-hit
kind: change
title: Bounded tree gutter drop hit testing
status: active
created: '2026-10-03'
profile: sdd@1
intent: Make last-child root outdent work when the pointer is left of the row.
outcomes:
- Existing tree gutter and final eight-pixel edge resolve the same root intent as
  row edges.
- Header, navigation, editor and unrelated areas remain invalid destinations.
scope:
- lib/ui/model/tree-drop.ts
- lib/ui/adapters/dom.js
- tests/ui/tree-drop.test.mjs
- tests/ui/dom.test.mjs
- docs/changes/change-20261003-tree-gutter-drop-hit/**
non_goals:
- New drop regions, backend changes, deployment or changes to movement semantics.
change_classes:
- behavior
- internal_design
governance:
  gate: auto
  reasons: []
members:
- role: requirements
  path: changes/change-20261003-tree-gutter-drop-hit/requirements.md
  required: true
- role: implementation
  path: changes/change-20261003-tree-gutter-drop-hit/implementation.md
  required: true
- role: verification
  path: changes/change-20261003-tree-gutter-drop-hit/verification.md
  required: true
promotion: []
unresolved_decisions: []
tags: []
owners: []
relations: []
source_paths:
- lib/ui/model/tree-drop.ts
- lib/ui/adapters/dom.js
- tests/ui/tree-drop.test.mjs
- tests/ui/dom.test.mjs
summary: Resolve root outdent from existing list gutter and final edge band without
  additional drop space.
updated: '2026-10-03'
---

## Summary

Existing list padding and a bounded final insertion edge participate in pure geometric hit testing.

## Closure Notes

Final local integration acceptance is complete: 302 tests, lint/typecheck, build, both built resources, fresh narrow/full read-only preview and 18 trusted native cases from actually served HTML passed. Independent review approved. Status remains active because the available scalar CLI does not express structured closure disposition; completed local acceptance is recorded here. No commit, push or deployment.


{% transition from="draft" to="ready" date="2026-10-03" %}
Independent cause proof established and permanent native DOM/pure regression passed.
{% /transition %}


{% transition from="ready" to="active" date="2026-10-03" %}
Native implementation source frozen; final independent and local integration acceptance running.
{% /transition %}
