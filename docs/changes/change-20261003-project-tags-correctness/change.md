---
id: change-20261003-project-tags-correctness
kind: change
title: Fix Project/Tag Undo Robustness and Input Validation
status: active
created: '2026-10-03'
profile: sdd@1
intent: Fix defects in Project/Tag Undo identity ABA, legacy deltas, strict input validation, preview projections, and owner isolation within a shared database.
outcomes:
- Undo works for legacy deltas without project_id from before migration while protecting later relationships.
- Reject missing nullable keys in moves and relationship updates, as well as null or non-boolean query values.
- Preview correctly projects catalog changes and tasks whose paths alone change into affected.
- Verify owner isolation, CAS, retries, and Undo for A/B owners in the same database through the shared port contract.
- Do not reuse deleted project/tag UUIDs during ordinary creation; only Undo of the original receipt can restore that ID.
- Per-identity markers and receipt revisions allow unrelated changes while rejecting task_tag ABA and later changes to restored references.
scope:
- lib/**
- db/**
- drizzle/**
- tests/**
- docs/**
non_goals:
- Deployment, commit, push, or changes to publication scope.
change_classes:
- behavior
- invariant
- internal_design
governance:
  gate: auto
  reasons: []
members:
- role: requirements
  path: changes/change-20261003-project-tags-correctness/requirements.md
  required: true
- role: implementation
  path: changes/change-20261003-project-tags-correctness/implementation.md
  required: true
- role: verification
  path: changes/change-20261003-project-tags-correctness/verification.md
  required: true
promotion: []
unresolved_decisions: []
tags: []
owners: []
relations:
- {type: references, target: change-20261003-projects-and-tags}
source_paths:
- lib/domain/core.ts
- lib/domain/operations.ts
- lib/adapters/d1-task-store.ts
- db/schema.ts
- tests/domain/project-tag.test.mjs
- tests/adapters/task-store-contract.test.mjs
- tests/adapters/storage-regression.test.mjs
- tests/application/task-service.test.mjs
- docs/technical/data-model.md
- docs/technical/mcp-api.md
- drizzle/0004_material_silhouette.sql
- lib/application/task-service.ts
- skills/action-tools/SKILL.md
summary: Align the implementation contract with the owner-scoped identity ledger, server-generated UUIDs, Undo conflicts, natural keys, and legacy receipt migration.
updated: '2026-10-03'
---

## Summary

This active change package records safety fixes for the initial Projects/Tags implementation. The implementation contract includes an identity ledger retained after deletion, per-identity Undo based on receipt revisions, task_tag ABA protection, server-generated UUIDs instead of caller IDs, natural-key Get-or-Create, and legacy receipt migration. Regression tests also cover later changes to referenced targets and legacy-delta compatibility.

## Closure Notes

Not closed. Keep the referenced [projects-and-tags feature package](../change-20261003-projects-and-tags/change.md) as an active, incomplete change, and coordinate this package's implementation contract and verification record with it. After recording local implementation verification, wait for independent review. Do not treat the original package as completed history.
