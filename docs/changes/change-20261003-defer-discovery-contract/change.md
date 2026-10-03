---
id: change-20261003-defer-discovery-contract
kind: change
title: Expose date-only Defer inputs in MCP discovery
status: active
created: '2026-10-03'
profile: sdd@1
intent: Prevent callers from confusing a calendar date with an instant when discovering
  Defer tools.
outcomes:
- A fresh caller discovers date plus timezone without guessing until syntax.
- Preview rejects mixed or unknown inputs consistently with apply.
scope:
- app/mcp/route.ts
- lib/domain/assistance.ts
- lib/domain/operations.ts
- skills/action-tools/**
- tests/ui/mcp-display.test.mjs
- tests/domain/action-model.test.mjs
- docs/technical/mcp-api.md
- docs/usage/agent-workflows.md
- docs/changes/change-20261003-defer-discovery-contract/**
- skills/action-guide/references/capabilities.md
non_goals:
- Hosted deployment, data migrations, changes to valid Defer semantics or Undo.
change_classes:
- internal_design
governance:
  gate: auto
  reasons: []
members:
- role: requirements
  path: changes/change-20261003-defer-discovery-contract/requirements.md
  required: true
- role: implementation
  path: changes/change-20261003-defer-discovery-contract/implementation.md
  required: true
- role: verification
  path: changes/change-20261003-defer-discovery-contract/verification.md
  required: true
promotion: []
unresolved_decisions: []
tags: []
owners: []
relations:
- {type: conformsTo, target: design-action-state-and-perspectives}
source_paths: []
summary: Publish mutually exclusive Defer date/timezone and instant inputs, align
  tool/Skill guidance, and validate date-only previews before normalization.
updated: '2026-10-04'
---

## Summary

Expose the existing calendar-date Defer contract to callers and keep preview validation consistent with apply.

## Closure Notes

Local implementation and verification passed. Hosted delivery and native Skill discovery remain outside scope.
