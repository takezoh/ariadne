---
id: change-20261003-inbox-task-model
kind: change
title: Integrate Inbox and original input into ordinary tasks
status: active
created: '2026-10-03'
profile: sdd@1
intent: Integrate original input into ordinary tasks and treat waiting as an explicit state. Scope includes DB/API/MCP, related state handling and required UI adjustments.
outcomes:
- Migrate without losing original text or wait reasons; keep incomplete state, Defer, Undo and retries consistent.
scope:
- lib/**
- db/**
- drizzle/**
- app/mcp/route.ts
- tests/**
- docs/**
- skills/action-tools/SKILL.md
- scripts/testing/smoke-built-widget.mjs
- ARCHITECTURE.md
- AGENTS.md
- README.md
non_goals:
- Deployment, new standalone UI features, automatic Tag creation or an organization status.
change_classes:
- behavior
governance:
  gate: auto
  reasons: []
members:
- role: requirements
  path: changes/change-20261003-inbox-task-model/requirements.md
  required: true
- role: implementation
  path: changes/change-20261003-inbox-task-model/implementation.md
  required: true
- role: verification
  path: changes/change-20261003-inbox-task-model/verification.md
  required: true
promotion: []
unresolved_decisions: []
tags: []
owners: []
relations:
- {type: modifies, target: design-state-and-perspectives}
- {type: conformsTo, target: design-effect-boundaries}
- {type: references, target: change-20261003-atomic-row-storage}
source_paths: []
updated: '2026-10-03'
summary: Integrate original input into ordinary tasks and expose independent waiting/Defer filters, thin attribute updates and parent-completion cascade.
---

## Summary

## Closure notes
