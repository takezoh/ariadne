---
id: change-20261014-cursor-api
kind: change
title: Add owner-scoped incremental change reads
status: active
created: '2026-10-14'
profile: sdd@1
intent: Add read-only owner-scoped cursor and paginated persisted-change APIs over
  retained owner revisions, with cache-compatible bootstrap and bounded local Worker
  D1 acceptance.
outcomes:
- Consumers retrieve persisted whole-operation deltas and opaque next positions without
  server-side consumer checkpoints.
- Complete snapshot bootstrap and incremental deltas share an explicit persisted DTO
  contract, including action_tags and a revision-consistent baseline cursor.
- API-1 through API-7 have local check/build and Worker env.DB evidence; independent
  review and caller-value criteria remain pending.
scope:
- Owner-scoped persisted change feed, cursor encoding/validation, pagination, snapshot
  bootstrap DTO projection, MCP tools, D1 history reads, tests, and current technical/caller
  documentation.
non_goals:
- Caller semantic interpretation, model-value evaluation, retained-context recovery
  experiments, or VALUE-1 through VALUE-4 acceptance.
- Hosted D1, Sites trusted-header provenance, ChatGPT Work retrieval/cache checks,
  deployment, or remote data changes.
- A second sequence/feed table, unbounded audit history, server-side consumer checkpoints,
  notifications, schedulers, or business-state mutation during reads.
change_classes:
- behavior
- boundary
- responsibility
- invariant
- internal_design
governance:
  gate: auto
  reasons: []
members:
- role: requirements
  path: changes/change-20261014-cursor-api/requirements.md
  required: true
- role: implementation
  path: changes/change-20261014-cursor-api/implementation.md
  required: true
- role: verification
  path: changes/change-20261014-cursor-api/verification.md
  required: true
promotion: []
unresolved_decisions: []
tags: []
owners: []
relations:
- {type: modifies, target: design-product}
- {type: conformsTo, target: design-assistance}
source_paths:
- lib/data/model/change-cursor.ts
- lib/domain/persisted-dto.ts
- lib/server/change-cursor-scope.ts
- lib/adapters/d1-action-store.ts
- lib/application/action-service.ts
- lib/mcp/private-registry.ts
- scripts/testing/verify-worker-d1.mjs
- tests/application/change-cursor.test.mjs
- tests/data/model/change-cursor.test.mjs
- docs/technical/mcp-api.md
- docs/technical/data-model.md
- docs/technical/testing.md
- docs/usage/agent-workflows.md
- docs/evidence/20261014-cursor-api-local-acceptance.json
- docs/design/product.md
- docs/design/assistance.md
- docs/development.md
summary: Implement the bounded owner-scoped cursor API and record API-1 through API-7
  local acceptance; caller-value evaluation and independent review remain pending.
updated: '2026-10-14'
---

# Owner-scoped incremental change reads

This package records the bounded cursor-api child unit for parent Issue #16, tracked as Issue #19. It implements the persisted-change retrieval contract and its local Worker D1 evidence. Caller interpretation, model-value evaluation, and combined parent acceptance are separate work.

The current API is described in the [MCP contract](../../technical/mcp-api.md#current-reads-and-incremental-changes), [data model](../../technical/data-model.md), and [caller workflow](../../usage/agent-workflows.md). Implementation details and criteria are in the required package members.

## Current status

The API-1 through API-7 implementation, `pnpm check`, `pnpm build`, and direct local Wrangler Worker `env.DB` acceptance are recorded as passed in the [local acceptance summary](../../evidence/20261014-cursor-api-local-acceptance.json). The package remains active while independent integration review and parent caller-value criteria VALUE-1 through VALUE-4 remain pending. This status does not claim hosted D1, trusted Sites identity provenance, ChatGPT Work acceptance, or deployment.


{% transition from="draft" to="ready" date="2026-10-14" %}
Requirements, implementation and verification package members are complete; local API acceptance is recorded.
{% /transition %}


{% transition from="ready" to="active" date="2026-10-14" %}
Implementation and local verification are complete; independent review and parent caller-value acceptance remain pending.
{% /transition %}
