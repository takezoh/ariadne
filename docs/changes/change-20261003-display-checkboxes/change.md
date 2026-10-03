---
id: change-20261003-display-checkboxes
kind: change
title: Independent display checkboxes
status: active
created: '2026-10-03'
profile: sdd@1
intent: Let users independently choose visible Action states without combination labels
  or creation instructions.
outcomes:
- Independent lifecycle checks and Deferred inclusion.
- No creation hint or ordinary filter summary.
scope:
- UI-only projection, menus and regression tests.
non_goals:
- Backend, database, hosted deployment and Git operations.
change_classes:
- behavior
governance:
  gate: auto
  reasons: []
members:
- role: requirements
  path: changes/change-20261003-display-checkboxes/requirements.md
  required: true
- role: implementation
  path: changes/change-20261003-display-checkboxes/implementation.md
  required: true
- role: verification
  path: changes/change-20261003-display-checkboxes/verification.md
  required: true
promotion: []
unresolved_decisions: []
tags: []
owners: []
relations: []
source_paths:
- lib/ui/model/navigation.ts
- lib/ui/model/catalog-tree.ts
- lib/ui/adapters/dom.js
- lib/widget.ts
- tests/ui/navigation.test.mjs
- tests/ui/catalog-tree.test.mjs
- tests/ui/dom.test.mjs
- scripts/testing/smoke-built-widget.mjs
summary: Replace combination display options with independent lifecycle and Deferred
  inclusion checks; remove creation instructions.
updated: '2026-10-03'
---

## Summary

Display choices are independent checkboxes. Inbox and saved Perspective definitions retain their established semantics. Native Profiles own implementation and independent review; the development-loop kernel was not executed.

## Closure Notes

Local implementation and acceptance are complete: UI117, full308 with zero failure/cancellation/skip/TODO, lint/typecheck, build, built2, read-only actual preview320/390/1280, independent review and served-HTML native12. No backend/database/host deployment or Git changes were performed by this Profile. Previous change packages remain unchanged.

The manifest remains active because the available scalar CLI cannot express the structured closure disposition. This state is a tooling limitation, not a claim of kernel completion. No kernel run or machine Git scope acceptance is claimed.


{% transition from="draft" to="ready" date="2026-10-03" %}
Observable checkbox contracts and native candidate are established.
{% /transition %}


{% transition from="ready" to="active" date="2026-10-03" %}
Native implementation complete; independent and root integration acceptance in progress.
{% /transition %}
