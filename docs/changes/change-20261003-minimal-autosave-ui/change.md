---
id: change-20261003-minimal-autosave-ui
kind: change
title: Minimal direct editing and autosave
status: active
created: '2026-10-03'
profile: sdd@1
intent: Make normal editing direct and minimal with autosave, without routine Save
  buttons or Review dialog.
outcomes:
- Valid editor changes save after debounce/blur while ongoing typing remains editable.
- Routine flag, lifecycle, date and organization changes use shared transitions without
  confirmation dialogs.
- Unknown writes retain exact requests; touched-field conflicts pause only their target
  for inline reconciliation.
scope:
- lib/ui/**
- lib/widget.ts
- tests/ui/**
- scripts/testing/smoke-built-widget.mjs
- ARCHITECTURE.md
- docs/technical/mcp-api.md
- docs/changes/change-20261003-minimal-autosave-ui/**
non_goals:
- No backend/domain/storage/schema/API/dependency/deployment changes.
change_classes:
- behavior
- internal_design
governance:
  gate: auto
  reasons: []
members:
- role: requirements
  path: changes/change-20261003-minimal-autosave-ui/requirements.md
  required: true
- role: implementation
  path: changes/change-20261003-minimal-autosave-ui/implementation.md
  required: true
- role: verification
  path: changes/change-20261003-minimal-autosave-ui/verification.md
  required: true
promotion: []
unresolved_decisions: []
tags: []
owners: []
relations:
- {type: conformsTo, target: design-action-state-and-perspectives}
source_paths: []
updated: '2026-10-03'
summary: Direct serial autosave with draft retention and inline conflict/unknown recovery.
---

## Summary

Minimal direct editing with automatic persistence and explicit exceptional recovery.

## Closure Notes

Local implementation and acceptance are complete: check 237/237, build, both built resources, browser creation/typing/IME/recovery/conflict suites and real local preview passed; native independent implementation and requirements acceptance approved. No commit, push or deployment. Status remains active because the CLI scalar patch interface cannot express the required structured closure/promotion disposition. Kernel execution and actual hosted acceptance remain unperformed.
