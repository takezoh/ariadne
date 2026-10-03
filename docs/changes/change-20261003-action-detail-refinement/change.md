---
id: change-20261003-action-detail-refinement
kind: change
title: Streamlined Action details and global save status
status: active
created: '2026-10-03'
profile: sdd@1
intent: Simplify Action details and unify temporal editing and global save feedback.
outcomes:
- Always-visible details with grouped icon-only Flag.
- One global header save-state icon.
- One coordinated Defer date and time proposal.
scope:
- UI models, controller write state, DOM, HTML, tests and artifact smoke.
non_goals:
- Backend, database, dependencies, host deployment and Git operations.
change_classes:
- behavior
governance:
  gate: auto
  reasons: []
members:
- role: requirements
  path: changes/change-20261003-action-detail-refinement/requirements.md
  required: true
- role: implementation
  path: changes/change-20261003-action-detail-refinement/implementation.md
  required: true
- role: verification
  path: changes/change-20261003-action-detail-refinement/verification.md
  required: true
promotion: []
unresolved_decisions: []
tags: []
owners: []
relations: []
source_paths:
- lib/ui/application.ts
- tests/ui/application.test.mjs
- lib/ui/model/date-input.ts
- lib/ui/model/save-status.ts
- lib/ui/adapters/dom.js
- lib/widget.ts
- tests/ui/date-input.test.mjs
- tests/ui/save-status.test.mjs
- tests/ui/dom.test.mjs
- scripts/testing/smoke-built-widget.mjs
summary: Always-visible details, icon-only Flag and global save feedback, and one
  coordinated Defer date/time flow.
updated: '2026-10-03'
---

## Summary

Native implementation follows the reviewed UI-only contract. The development-loop kernel is not executed.

## Closure Notes

Local implementation and acceptance are complete: UI124, full315 with no failures/cancellations/skips/TODO, lint/typecheck, final CSS lint, build, built2, read-only actual preview320/390/1280, native independent review and served-HTML trusted drag12. Flag is compactly grouped and orange in both themes. Scoped failed operation diagnosis remains until matching resolution; raw date/time, precision, IME and unknown recovery remain verified.

The manifest remains active because the scalar CLI does not express the required structured closure disposition. This tooling status does not imply incomplete local acceptance or a kernel run. No backend/database/host deployment or Git operation was performed by this Profile; machine Git scope acceptance is not claimed. Older packages are unchanged.


{% transition from="draft" to="ready" date="2026-10-03" %}
Native reviewed UI contracts and frozen candidate are established.
{% /transition %}


{% transition from="ready" to="active" date="2026-10-03" %}
Implementation and independent candidate checks complete; root final integration in progress.
{% /transition %}
