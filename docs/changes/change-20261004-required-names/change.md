---
id: change-20261004-required-names
kind: change
title: Required Action titles and catalog names
status: active
created: '2026-10-04'
profile: sdd@1
intent: Prevent unnamed persisted Actions while preserving local proposals and existing
  records.
outcomes:
- Action creation requires a nonempty Title; Notes remain optional.
- Invalid Title edits remain local with accessible adjacent feedback.
scope: []
non_goals: []
change_classes:
- behavior
governance:
  gate: auto
  reasons: []
members:
- role: requirements
  path: changes/change-20261004-required-names/requirements.md
  required: true
- role: implementation
  path: changes/change-20261004-required-names/implementation.md
  required: true
- role: verification
  path: changes/change-20261004-required-names/verification.md
  required: true
promotion: []
unresolved_decisions: []
tags: []
owners: []
relations: []
source_paths:
- lib/ui/model/transient-create.ts
- lib/ui/model/autosave.ts
- tests/ui/transient-create.test.mjs
- tests/ui/dom.test.mjs
- tests/ui/movement-application.test.mjs
- tests/ui/mcp-display.test.mjs
- scripts/testing/smoke-built-widget.mjs
- ARCHITECTURE.md
- lib/domain/core.ts
- lib/application/action-service.ts
- app/mcp/route.ts
- tests/domain/empty-action.test.mjs
- tests/adapters/empty-action-store.test.mjs
- tests/application/action-service.test.mjs
- docs/technical/data-model.md
- docs/technical/mcp-api.md
summary: Require a valid Title before persisting local Actions and retain invalid
  Title proposals without overwriting saved data.
updated: '2026-10-04'
---

## Summary

## Closure Notes

## Implementation status

Native implementation Profile used; no development kernel receipt is claimed. Backend required-name validation is owned by the separate backend Profile. UI source is limited to pure eligibility/validation and test/acceptance alignment. Host deployment and Git operations are outside this change.


{% transition from="draft" to="ready" date="2026-10-04" %}
Native contracts agreed and targeted UI acceptance passed.
{% /transition %}


{% transition from="ready" to="active" date="2026-10-04" %}
Native implementation and independent review complete; root integration pending.
{% /transition %}

## Local completion

Implementation and acceptance are complete: 351 tests passed with zero failures/cancellations/skips/TODOs, lint/typecheck passed, build passed, both built UI resources passed, and actual local preview confirmed zero-write untouched/Notes-only proposals. Reviewed and protected source hashes matched. The lifecycle remains active because the scalar transition CLI cannot supply the structured closure disposition required for closing; this is a documentation-tool constraint, not pending product work. No Git operation, hosted deployment or kernel receipt is claimed.
