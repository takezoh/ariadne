---
id: change-20261003-catalog-descriptions
kind: change
title: Expose catalog descriptions through the shared data API
status: done
created: '2026-10-03'
profile: sdd@1
intent: Expose caller-controlled descriptive context without enforcing a workflow
  or changing action semantics.
outcomes:
- Descriptions round trip and edit safely through data API/MCP; existing data and
  Undo history are retained.
scope:
- lib/domain/**
- lib/application/**
- lib/adapters/**
- db/schema.ts
- drizzle/**
- app/mcp/route.ts
- tests/**
- docs/technical/**
- ARCHITECTURE.md
- docs/changes/change-20261001-structured-todo-mvp/change.md
- docs/note/note-20261003-repair-historical-mvp-closure-declaratio.md
- docs/issue/issue-20261003-historical-mvp-closure-lacks-required-ve.md
non_goals:
- UI controls, hosted rollout and source publishing.
change_classes:
- capability
- internal_design
governance:
  gate: auto
  reasons: []
members:
- role: requirements
  path: changes/change-20261003-catalog-descriptions/requirements.md
  required: true
- role: implementation
  path: changes/change-20261003-catalog-descriptions/implementation.md
  required: true
- role: verification
  path: changes/change-20261003-catalog-descriptions/verification.md
  required: true
promotion:
- action: none
  reason: The existing action-state responsibility and integrity design remains unchanged;
    descriptions are non-executable context. Current architecture and technical references
    document the additive data/API capability.
evidence_refs:
- type: test
  ref: tests/adapters/catalog-description.test.mjs
- type: test
  ref: tests/adapters/description-api.test.mjs
- type: test
  ref: tests/domain/catalog-description.test.mjs
- type: command
  ref: pnpm check
- type: command
  ref: pnpm build
- type: source
  ref: docs/changes/change-20261003-catalog-descriptions/verification.md
unresolved_decisions: []
tags: []
owners: []
relations:
- {type: conformsTo, target: design-action-state-and-perspectives}
- {type: references, target: note-20261003-repair-historical-mvp-closure-declaratio}
source_paths: []
summary: Add exact free-text catalog descriptions to shared persistence and HTTP/MCP
  operations without changing UI or semantic rules.
updated: '2026-10-03'
promotion_applied_at: '2026-10-03T06:12:30.458095+00:00'
closure:
  closed_at: '2026-10-03T06:12:31.805736+00:00'
  content_hash: sha256:17aa463057c77db3dd79e31d4a0e7234e6a35356448a5845dbaecb6cb50f9ba1
---

## Summary

Expose descriptive context through data persistence and shared API/MCP operations while retaining deterministic extraction and safety guarantees. Implementation and validation are local; dedicated UI and hosted rollout are outside scope.

## Closure Notes

Local data/API implementation and verification are complete. This change also includes the user-requested historical declaration maintenance recorded in the linked audit. Dedicated UI and hosted rollout remain outside scope.

### Authorized Ariadne Name Normalization

On 2026-10-04, the user explicitly requested replacement of all previous product names, including completed records and archived evidence. Names and references were normalized; the closure checksum was recalculated for this editorial update. The previous checksum was `sha256:14ff3f2280592bbb1981c64831a9457c994aec7f9cdc02842d34adca4ed64ed0`. This update is not new deployment or acceptance evidence. See [normalization provenance](../../evidence/20261004-name-normalization.json).
