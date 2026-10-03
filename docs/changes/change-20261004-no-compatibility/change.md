---
id: change-20261004-no-compatibility
kind: change
title: Remove compatibility paths and require current names
status: active
created: '2026-10-04'
profile: sdd@1
intent: Require the current complete wire contract without legacy compatibility paths.
outcomes:
- Complete persisted snapshots and required names are enforced.
- Local proposals and exact unknown requests remain preserved.
scope: []
non_goals: []
change_classes:
- behavior
governance:
  gate: auto
  reasons: []
members:
- role: requirements
  path: changes/change-20261004-no-compatibility/requirements.md
  required: true
- role: implementation
  path: changes/change-20261004-no-compatibility/implementation.md
  required: true
- role: verification
  path: changes/change-20261004-no-compatibility/verification.md
  required: true
promotion: []
unresolved_decisions: []
tags: []
owners: []
relations: []
source_paths:
- lib/ui/model/autosave.ts
- lib/ui/model/catalog-drafts.ts
- lib/ui/application.ts
- tests/ui/autosave.test.mjs
- tests/ui/dom.test.mjs
- tests/ui/application.test.mjs
- tests/ui/transient-create.test.mjs
- ARCHITECTURE.md
- lib/domain/core.ts
- lib/domain/operations.ts
- lib/application/action-service.ts
- app/mcp/route.ts
- db/schema.ts
- drizzle/0015_required_catalog_names.sql
- drizzle/meta/0015_snapshot.json
- drizzle/meta/_journal.json
- tests/helpers/sqlite-d1.mjs
- tests/domain/empty-action.test.mjs
- tests/domain/empty-catalog.test.mjs
- tests/domain/current-schema.test.mjs
- tests/domain/project-move.test.mjs
- tests/domain/action-model.test.mjs
- tests/domain/action-order-flag.test.mjs
- tests/domain/project-tag.test.mjs
- tests/adapters/empty-action-store.test.mjs
- tests/adapters/empty-catalog.test.mjs
- tests/adapters/project-move.test.mjs
- tests/adapters/catalog-description.test.mjs
- tests/application/current-schema.test.mjs
- tests/application/action-service.test.mjs
- docs/technical/data-model.md
- docs/technical/mcp-api.md
summary: Remove legacy blank-name validation exceptions and alternate draft acknowledgment
  implementation.
updated: '2026-10-04'
---

## Summary

## Closure Notes


{% transition from="draft" to="ready" date="2026-10-04" %}
Current wire and name contracts agreed; native targeted verification passed.
{% /transition %}


{% transition from="ready" to="active" date="2026-10-04" %}
Native implementation frozen; root integration pending.
{% /transition %}

## Local completion

Implementation and current-contract acceptance are complete: 358 tests passed without failures/cancellations/skips/TODOs; lint/typecheck, build and both built resources passed. Local migration 0015 changed indexes only, preserving all seven data tables and receipt content. Actual authenticated preview rejects eight untouched blank Actions with zero writes, as required by the no-fallback contract; the preview remains unusable for that invalid existing data until separately authorized remediation. No data cleanup or hosted change was performed. The lifecycle remains active because the scalar documentation CLI cannot express the required structured closure disposition; no product implementation work remains.
