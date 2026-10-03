---
id: change-20261003-contextual-create-calendar
kind: change
title: Contextual direct creation and uniform 24-hour calendars
status: active
created: '2026-10-03'
profile: sdd@1
intent: Direct creation follows the explicit visible selection and calendars use one
  24-hour flow.
outcomes:
- Every view can create an ordinary Action without changing its filters.
- Header catalog creation persists a distinct empty record and opens Name editing.
- Due and Defer preserve precise instants with explicit 24-hour clocks.
scope:
- UI creation context, serial writes, typed receipt recovery and temporary reveal
- Uniform calendar inputs and empty catalog persistence contract
non_goals:
- Hosted deployment, caller recommendations and implicit lifecycle changes
change_classes:
- behavior
- boundary
- invariant
governance:
  gate: auto
  reasons: []
members:
- role: requirements
  path: changes/change-20261003-contextual-create-calendar/requirements.md
  required: true
- role: implementation
  path: changes/change-20261003-contextual-create-calendar/implementation.md
  required: true
- role: verification
  path: changes/change-20261003-contextual-create-calendar/verification.md
  required: true
promotion: []
unresolved_decisions: []
tags: []
owners: []
relations: []
source_paths:
- lib/ui/model/date-input.ts
- lib/ui/model/navigation.ts
- lib/ui/model/catalog-tree.ts
- lib/ui/model/picker.ts
- lib/ui/model/catalog-drafts.ts
- lib/ui/application.ts
- lib/ui/adapters/dom.js
- lib/widget.ts
- tests/ui/date-input.test.mjs
- tests/ui/catalog-tree.test.mjs
- tests/ui/navigation.test.mjs
- tests/ui/application.test.mjs
- tests/ui/dom.test.mjs
- scripts/testing/smoke-built-widget.mjs
- tests/ui/movement-application.test.mjs
- tests/ui/autosave.test.mjs
- ARCHITECTURE.md
- lib/domain/core.ts
- lib/application/action-service.ts
- app/mcp/route.ts
- db/schema.ts
- drizzle/0014_empty_catalog_names.sql
- drizzle/meta/_journal.json
- drizzle/meta/0014_snapshot.json
- tests/helpers/sqlite-d1.mjs
- tests/adapters/empty-catalog.test.mjs
- tests/domain/empty-catalog.test.mjs
- tests/domain/empty-action.test.mjs
- docs/technical/mcp-api.md
- docs/technical/data-model.md
summary: Use identical 24-hour date/time pairs and create empty Actions, Projects
  and Tags in the explicit current selection context.
updated: '2026-10-04'
---

## Summary

## Closure Notes

Local implementation and acceptance are complete:334 full tests, lint/typecheck, build, both built UI resources, additive0014 preservation, fresh320/390/1280 preview, and12 actual-served trusted native drag cases passed. Native reviews approved the frozen source. See [verification](verification.md).

Structured closure disposition cannot be represented by this CLI scalar transition interface; the document remains active with local completion recorded here. No development-loop kernel or hosted acceptance is asserted. Machine Git ingestion is UNKNOWN; no automated scope coverage or unperformed manual scope check is claimed.

Direct creation uses frozen invocation context. Empty catalog records have independent UUIDs; display fallbacks never modify stored names or paths. Native implementation Profiles own UI and persistence separately.


{% transition from="draft" to="ready" date="2026-10-04" %}
Native boundary approved; implementation and targeted regressions complete; root integration pending.
{% /transition %}


{% transition from="ready" to="active" date="2026-10-04" %}
Native implementation is frozen and targeted regressions passed; root integration gates in progress.
{% /transition %}
