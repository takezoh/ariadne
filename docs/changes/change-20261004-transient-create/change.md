---
id: change-20261004-transient-create
kind: change
title: Content-first transient creation
status: active
created: '2026-10-04'
profile: sdd@1
intent: Keep uncommitted Add input local and save only meaningful valid content.
outcomes:
- Untouched Add never creates empty persisted rows.
- Valid content creates exactly one record and preserves dependent proposals and unknown
  requests.
scope:
- UI transient creation and bounded catalog validation
non_goals:
- New database migration, hosted deployment and caller workflow changes
change_classes:
- behavior
- implementation_only
governance:
  gate: auto
  reasons: []
members:
- role: requirements
  path: changes/change-20261004-transient-create/requirements.md
  required: true
- role: implementation
  path: changes/change-20261004-transient-create/implementation.md
  required: true
- role: verification
  path: changes/change-20261004-transient-create/verification.md
  required: true
promotion: []
unresolved_decisions: []
tags: []
owners: []
relations: []
source_paths:
- tests/ui/autosave.test.mjs
- tests/ui/movement-application.test.mjs
- lib/domain/core.ts
- app/mcp/route.ts
- docs/technical/data-model.md
- docs/technical/mcp-api.md
- tests/domain/empty-catalog.test.mjs
- tests/adapters/empty-catalog.test.mjs
- lib/ui/model/transient-create.ts
- lib/ui/model/catalog-drafts.ts
- lib/ui/application.ts
- lib/ui/adapters/dom.js
- lib/widget.ts
- tests/ui/transient-create.test.mjs
- tests/ui/application.test.mjs
- tests/ui/dom.test.mjs
- scripts/testing/smoke-built-widget.mjs
- ARCHITECTURE.md
summary: Keep Add local until genuine content is valid, then commit and remap identity
  through the serial lane.
updated: '2026-10-04'
---

## Summary

Add opens a temporary editable row; valid content is the persistence boundary.

## Closure Notes

Local implementation and acceptance are complete, including catalog Close and explicit selected-temporary Add replacement: independent review approved; final check passed all 376 tests with no failures/cancelled/skipped/TODO and lint/typecheck passed; final build and both built UI resources passed; fresh authenticated preview confirmed replacement and Close for Action/Project/Tag with zero mutating HTTP requests and unchanged authoritative snapshot. The five final runtime/test hashes matched. The structured lifecycle remains active because the scalar CLI transition cannot express the required closure disposition. No kernel execution, hosted deployment, hosted D1 acceptance or Git ingestion result is claimed.


{% transition from="draft" to="ready" date="2026-10-04" %}
Native requirements and bounded implementation are complete; final integration gates pending.
{% /transition %}


{% transition from="ready" to="active" date="2026-10-04" %}
Frozen native implementation is in parent integration acceptance.
{% /transition %}
