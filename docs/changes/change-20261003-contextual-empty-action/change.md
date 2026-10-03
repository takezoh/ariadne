---
id: change-20261003-contextual-empty-action
kind: change
title: Contextual empty action creation
status: active
created: '2026-10-03'
profile: sdd@1
intent: Create an ordinary empty Action in the selected context, then edit it; preserve
  one-call populated MCP creation.
outcomes:
- UI Add persists an empty ordinary Action in its explicit classification context.
- MCP creates populated Actions with initial tags in one atomic request.
- Unknown creation retains exact context and recovers the generated ID without losing
  drafts.
scope:
- lib/domain/**
- lib/application/**
- lib/server/**
- app/mcp/route.ts
- lib/ui/**
- lib/widget.ts
- tests/**
- scripts/testing/smoke-built-widget.mjs
- ARCHITECTURE.md
- docs/technical/data-model.md
- docs/technical/mcp-api.md
- docs/changes/change-20261003-contextual-empty-action/**
non_goals:
- No schema migration, dependency, deployment, catalog CRUD or Perspective creation
  rules.
change_classes:
- behavior
- internal_design
governance:
  gate: auto
  reasons: []
members:
- role: requirements
  path: changes/change-20261003-contextual-empty-action/requirements.md
  required: true
- role: implementation
  path: changes/change-20261003-contextual-empty-action/implementation.md
  required: true
- role: verification
  path: changes/change-20261003-contextual-empty-action/verification.md
  required: true
promotion: []
unresolved_decisions: []
tags: []
owners: []
relations:
- {type: conformsTo, target: design-action-state-and-perspectives}
source_paths: []
updated: '2026-10-03'
summary: Contextual empty Action creation with atomic initial tags and receipt-derived
  identity.
---

## Summary

Direct contextual empty Action creation followed by ordinary editing.

## Closure Notes

Local implementation and acceptance are complete: check 239/239, build, built resources, Chromium and live preview passed; independent native review approved. No commit, push or deployment. The package remains active because structured closure/promotion disposition is not expressible through this CLI scalar patch interface. Kernel execution and actual hosted acceptance were not performed.
