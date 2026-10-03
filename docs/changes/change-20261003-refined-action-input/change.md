---
id: change-20261003-refined-action-input
kind: change
title: Contiguous selection, calendar inputs and catalog creation
status: active
created: '2026-10-03'
profile: sdd@1
intent: Make selection, dragging, dates and classification directly discoverable without
  extra dialogs.
outcomes:
- Shift selects only a contiguous visible range; row and title drag use that exact
  selection.
- Calendar inputs resolve explicit timezone instants and preserve date-only Defer
  at local 09:00.
- Project and Tag creation use existing server-generated catalog identities and exact
  recovery.
scope:
- lib/ui/**
- lib/widget.ts
- tests/ui/**
- scripts/testing/smoke-built-widget.mjs
- docs/changes/change-20261003-refined-action-input/**
non_goals:
- Backend, schema, domain, deployment and catalog CRUD beyond creation.
change_classes:
- behavior
- internal_design
governance:
  gate: auto
  reasons: []
members:
- role: requirements
  path: changes/change-20261003-refined-action-input/requirements.md
  required: true
- role: implementation
  path: changes/change-20261003-refined-action-input/implementation.md
  required: true
- role: verification
  path: changes/change-20261003-refined-action-input/verification.md
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
summary: Shift-only contiguous selection, row drag, explicit timezone calendar inputs
  and existing catalog creation in the minimal UI.
updated: '2026-10-03'
---

## Summary

Refine direct input and movement using the existing owner-wide autosave and receipt lane.

## Closure Notes

Local implementation and integration acceptance completed: 262 tests, lint/typecheck, build, both built UI resources, fresh preview and native independent review passed. No commit, push or deployment. The package remains structurally active because the CLI scalar patch interface cannot represent structured closure disposition; this documentation lifecycle limitation does not indicate pending implementation. Native Profile execution does not claim development-loop kernel execution.


{% transition from="draft" to="ready" date="2026-10-03" %}
Observable contracts and scoped native implementation are complete.
{% /transition %}


{% transition from="ready" to="active" date="2026-10-03" %}
Native candidate verification and independent integration gates are in progress.
{% /transition %}
