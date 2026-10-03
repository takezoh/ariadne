---
id: change-20261003-modern-simple-ui
kind: change
title: Modern simple shared action interface
status: active
created: '2026-10-03'
profile: sdd@1
intent: Make the shared Ariadne UI modern, simple and intuitive while preserving proposals
  and exact recovery.
outcomes:
- Named list-first controls with coherent generated SVG icons work in narrow and broad
  layouts.
- All unsaved input, focus and recovery state survives refresh and supported display
  changes.
scope:
- lib/ui/**
- lib/widget.ts
- app/board.tsx
- app/mcp/route.ts
- tests/ui/**
- scripts/testing/**
- docs/changes/change-20261003-modern-simple-ui/**
non_goals:
- Domain/store/schema changes, dependencies, deployment, new Sites/Plugins or broader
  access.
change_classes:
- behavior
- internal_design
governance:
  gate: auto
  reasons: []
members:
- role: requirements
  path: changes/change-20261003-modern-simple-ui/requirements.md
  required: true
- role: implementation
  path: changes/change-20261003-modern-simple-ui/implementation.md
  required: true
- role: verification
  path: changes/change-20261003-modern-simple-ui/verification.md
  required: true
promotion: []
unresolved_decisions: []
tags: []
owners: []
relations:
- {type: conformsTo, target: design-action-state-and-perspectives}
source_paths: []
summary: Modern list-first UI with complete proposal continuity and truthful MCP Apps
  display support.
updated: '2026-10-03'
---

## Summary

Modernize the one shared action interface with named navigation, selected details, generated vector icons and truthful host display support. Preserve every proposal and exact recovery guarantee.

## Closure Notes

Local implementation, whole-tree check, build, built-resource acceptance and final native independent review are complete. Hosted deployment and actual host acceptance remain outside this change. The package lifecycle stays active because the current documentation CLI cannot express its required structured none/reason promotion manifest.
