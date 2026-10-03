---
id: change-20261004-tag-order
kind: change
title: Durable Tag sibling order and relative tree movement
status: active
created: '2026-10-04'
profile: sdd@1
intent: Preserve explicit durable Tag sequence across catalog movement.
outcomes:
- Tag siblings display persisted order before name and UUID.
- Tag pointer and keyboard movements share relative atomic intents.
scope: []
non_goals: []
change_classes:
- behavior
governance:
  gate: auto
  reasons: []
members:
- role: requirements
  path: changes/change-20261004-tag-order/requirements.md
  required: true
- role: implementation
  path: changes/change-20261004-tag-order/implementation.md
  required: true
- role: verification
  path: changes/change-20261004-tag-order/verification.md
  required: true
promotion: []
unresolved_decisions: []
tags: []
owners: []
relations: []
source_paths:
- lib/ui/model/catalog-tree.ts
- lib/ui/model/navigation.ts
- lib/ui/adapters/dom.js
- tests/ui/catalog-tree.test.mjs
- tests/ui/dom.test.mjs
- tests/ui/transient-create.test.mjs
- scripts/testing/smoke-built-widget.mjs
- ARCHITECTURE.md
- lib/domain/core.ts
- lib/domain/operations.ts
- lib/adapters/d1-action-store.ts
- db/schema.ts
- app/mcp/route.ts
- drizzle/0016_tag_order.sql
- drizzle/meta/0016_snapshot.json
- drizzle/meta/_journal.json
- tests/helpers/sqlite-d1.mjs
- tests/domain/tag-move.test.mjs
- tests/domain/project-move.test.mjs
- tests/adapters/tag-move.test.mjs
- tests/adapters/project-move.test.mjs
- tests/adapters/catalog-description.test.mjs
- docs/technical/data-model.md
- docs/technical/mcp-api.md
- tests/adapters/action-model-migration.test.mjs
- tests/adapters/empty-catalog.test.mjs
- tests/adapters/perspective-migration.test.mjs
- tests/domain/empty-action.test.mjs
summary: Order Tag siblings durably and share relative catalog movement through pointer
  and keyboard chooser.
updated: '2026-10-04'
---

## Summary

## Closure Notes


{% transition from="draft" to="ready" date="2026-10-04" %}
Native Tag order and relative movement contracts are implemented and targeted acceptance passed.
{% /transition %}


{% transition from="ready" to="active" date="2026-10-04" %}
Native implementation frozen; independent review and root integration are underway.
{% /transition %}

## Local completion

Native implementation and acceptance are complete: 369 tests passed without failures/cancellations/skips/TODOs; lint/typecheck, build, both built resources and authenticated real read-only preview passed. Local migration 0016 preserved current data and historical migration content. Trusted memory/API mouse and chooser proofs verify exact Tag parent and rank, and final Action left-gutter outdent. Initial Worker manifest startup failure recovered without source changes; a generation race remains an inference. Structured closing disposition cannot be expressed by the scalar CLI, so active records local completion with this tooling limitation. No Git operation, deployment or development-kernel receipt was performed.
