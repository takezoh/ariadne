---
id: change-20261003-atomic-row-storage
kind: change
title: Atomically persist changed related rows and remove unused columns
status: active
created: '2026-10-03'
profile: sdd@1
intent: Retire full-table rewrites and owner_state; atomically persist changed relationship rows and receipts. Remove unused columns and persistent time-zone settings.
outcomes:
- Persist only changed rows and receipt in one D1 batch; roll back everything on failure.
- Remove owner_state, initial title, last request ID and defer zone; use UTC instants with client-time-zone display.
- Evaluate the completed Project/Tag implementation and document gaps in Inbox and the reference product state semantics.
scope:
- lib/**
- app/mcp/route.ts
- db/schema.ts
- drizzle/**
- tests/**
- docs/**
- skills/action-tools/SKILL.md
- ARCHITECTURE.md
- AGENTS.md
non_goals:
- Deployment, commit, push or changing owner-only access.
- New public API for Inbox/Project/Tag state, original-input integration or per-record revisions.
change_classes:
- boundary
- invariant
- internal_design
governance:
  gate: auto
  reasons: []
members:
- role: requirements
  path: changes/change-20261003-atomic-row-storage/requirements.md
  required: true
- role: implementation
  path: changes/change-20261003-atomic-row-storage/implementation.md
  required: true
- role: verification
  path: changes/change-20261003-atomic-row-storage/verification.md
  required: true
promotion: []
unresolved_decisions: []
tags: []
owners: []
relations:
- {type: conformsTo, target: design-effect-boundaries}
- {type: modifies, target: design-state-and-perspectives}
- {type: references, target: change-20261003-project-tags-correctness}
source_paths: []
summary: Stop full-table rewrites; atomically update operation records and related rows; remove unused persistence columns and persistent time-zone settings.
updated: '2026-10-03'
---

## Summary

Move to atomic delta persistence for related rows and receipts, and retire `owner_state` and unused columns. Keep the assessment of completed Project/Tag implementation and unimplemented Inbox/the reference product state behavior in the implementation document.

## Closure notes

Do not rewrite the existing Project/Tag change. Production deployment and real Work acceptance are outside this change's acceptance scope.
