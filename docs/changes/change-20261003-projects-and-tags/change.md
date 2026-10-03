---
id: change-20261003-projects-and-tags
kind: change
title: Project and tag hierarchies, associations and queries
status: active
created: '2026-10-03'
profile: sdd@1
intent: Associate hierarchical projects and tags with tasks and support queries by parent and descendants through a thin API/MCP. Preserve existing persistence contracts and C1-C4; add them through non-destructive migrations.
outcomes:
- Store projects and tags separately per owner with stable IDs, local names and nullable parent_id.
- Give tasks zero or one project and multiple tags; queries by parent may expand descendants and deduplicate results.
- Reject cycles, dangling and cross-owner references. Reject deletion while children or references remain.
- Preserve schemaVersion 2, owner isolation, atomic CAS, receipts, identical retries, Undo and C1-C4.
- Generate UUIDs for new task/project/tag/capture entities in Ariadne. Keep them separate from operationId and atomically save resolved results in receipts.
- Get-or-Create projects/tags by owner, parent and trimmed case-sensitive name; reject natural-key collisions on rename/move.
- Resolve new tasks in structure_create using unique local refs; use existing IDs only as references. Mark preview candidates preview_only.
- Keep project/tag IDs reserved after deletion and track last-changed revision for project/tag/task_tag identities in a per-identity ledger for safe Undo.
- Migration 0004 backfills identity revisions from legacy receipt deltas and fails rather than merging duplicate natural keys.
scope:
- lib/**
- db/**
- drizzle/**
- app/mcp/route.ts
- app/api/tasks/route.ts
- tests/**
- docs/**
- ARCHITECTURE.md
- skills/action-tools/SKILL.md
non_goals:
- Add flags, a recommendation engine, saved perspectives, automatic notifications or calendar sync.
- Deployment, commit, push or changes to publication visibility.
- Create a new UI except where required for snapshot compatibility.
change_classes:
- behavior
- capability
- invariant
governance:
  gate: auto
  reasons: []
members:
- role: requirements
  path: changes/change-20261003-projects-and-tags/requirements.md
  required: true
- role: implementation
  path: changes/change-20261003-projects-and-tags/implementation.md
  required: true
- role: verification
  path: changes/change-20261003-projects-and-tags/verification.md
  required: true
promotion: []
unresolved_decisions: []
tags: []
owners: []
relations: []
source_paths:
- lib/domain/core.ts
- lib/domain/operations.ts
- lib/application/task-service.ts
- lib/adapters/d1-task-store.ts
- app/mcp/route.ts
- db/schema.ts
- drizzle/0002_worthless_lorna_dane.sql
- tests/domain/project-tag.test.mjs
- tests/adapters/storage-regression.test.mjs
- docs/technical/data-model.md
- docs/technical/mcp-api.md
- ARCHITECTURE.md
- skills/action-tools/SKILL.md
- drizzle/0004_material_silhouette.sql
- lib/domain/assistance.ts
- tests/application/task-service.test.mjs
- tests/adapters/task-store-contract.test.mjs
- tests/helpers/memory-task-store.mjs
- tests/helpers/sqlite-d1.mjs
- docs/design/state-and-perspectives.md
summary: Add server-generated UUIDs, Get-or-Create, reference refs, per-identity Undo protection and migrations for existing data to hierarchical projects/tags.
updated: '2026-10-03'
---

## Summary

Store projects and tags per owner in hierarchies separate from task parents, and associate each task with zero or one project and multiple tags. Queries by parent may include descendants. Paths are derived for display; stable IDs define identity. Reject cycles, dangling and cross-owner references, and reject deletion while child nodes or task references remain. Preserve schemaVersion 2, owner isolation, atomic CAS, receipts, identical retries, Undo and C1-C4, and preserve existing data with additive migrations.

## Closure notes

Not closed. Awaiting local verification with `pnpm check` and `pnpm build`, and the independent review verdict. Deployment, commit and push are out of scope.
