---
id: change-20261004-independent-flag-clock
kind: change
title: Independent Flag and persistent 24-hour clock mask
status: active
created: '2026-10-04'
profile: sdd@1
outcomes:
- Flag is visually independent from the exclusive lifecycle group.
- Clock input keeps trailing missing segments visible during progressive editing.
change_classes:
- behavior
- implementation_only
intent: Make Flag distinct and keep clock input guidance visible after typing starts.
scope:
- Bounded UI presentation and clock input assistance
non_goals:
- Backend, database, deployment and broad interaction redesign
governance:
  gate: auto
  reasons: []
members:
- role: requirements
  path: changes/change-20261004-independent-flag-clock/requirements.md
  required: true
- role: implementation
  path: changes/change-20261004-independent-flag-clock/implementation.md
  required: true
- role: verification
  path: changes/change-20261004-independent-flag-clock/verification.md
  required: true
promotion: []
unresolved_decisions: []
tags: []
owners: []
relations: []
source_paths:
- lib/widget.ts
- lib/ui/adapters/dom.js
- lib/ui/model/date-input.ts
- tests/ui/dom.test.mjs
- tests/ui/date-input.test.mjs
- scripts/testing/smoke-built-widget.mjs
summary: Separate Flag from lifecycle and retain missing clock segments during input.
updated: '2026-10-04'
---

## Summary

Flag is an independent toggle outside the four-button lifecycle group. Clock editing keeps visible missing trailing segments after typing begins and supplies numeric separators without saving incomplete values.

## Closure Notes

Local implementation and acceptance are complete. The change remains structurally active because the CLI cannot express the required structured closure disposition in its scalar transition arguments. No kernel completion, hosted deployment, hosted D1 acceptance or Git scope ingestion is claimed.


{% transition from="draft" to="ready" date="2026-10-04" %}
Native requirements and implementation are complete; integration evidence pending.
{% /transition %}


{% transition from="ready" to="active" date="2026-10-04" %}
Native source is frozen and independent and parent integration gates are running.
{% /transition %}
