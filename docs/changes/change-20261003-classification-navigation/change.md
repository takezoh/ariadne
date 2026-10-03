---
id: change-20261003-classification-navigation
kind: change
title: Classification and perspective navigation
status: active
created: '2026-10-03'
profile: sdd@1
intent: Make navigation reflect Inbox, direct classification and saved perspectives
  while preserving on-hold visibility and exact recovery.
outcomes:
- Projects and Tags expose direct exact or explicitly descendant-expanded classification
  without hiding on-hold actions.
- Saved perspectives evaluate exact filters and History keeps completed and dropped
  states distinct.
- Navigation retains all drafts, capture text and exact unknown requests without accepting
  partial snapshots.
scope:
- lib/ui/**
- lib/widget.ts
- tests/ui/**
- ARCHITECTURE.md
- docs/technical/data-model.md
- docs/technical/mcp-api.md
- docs/changes/change-20261003-classification-navigation/**
non_goals:
- No backend, schema, storage, dependency or deployment change.
- No catalog or perspective creation, editing or removal UI.
change_classes:
- behavior
- internal_design
governance:
  gate: auto
  reasons: []
members:
- role: requirements
  path: changes/change-20261003-classification-navigation/requirements.md
  required: true
- role: implementation
  path: changes/change-20261003-classification-navigation/implementation.md
  required: true
- role: verification
  path: changes/change-20261003-classification-navigation/verification.md
  required: true
promotion: []
unresolved_decisions: []
tags: []
owners: []
relations:
- {type: conformsTo, target: design-action-state-and-perspectives}
source_paths: []
summary: Inbox, Projects, Tags, Flagged and History navigation with exact saved perspective
  browsing.
updated: '2026-10-03'
---

## Summary

Make classifications and saved Perspectives the navigation entrances while preserving explicit on-hold visibility and exact recovery.

## Closure Notes

Local implementation and independent native requirements, design and repaired implementation review are complete. Final combined check passed all 228 tests with zero failures, cancellations, skips or TODOs; build and both built UI resources passed. Chromium visual/recovery evidence and fresh actual local Web preview passed. The English preview remains available on port 5173.

No runtime-kernel receipt, hosted D1/ChatGPT Work acceptance, commit, push or deployment is claimed. Package lifecycle remains active because the current documentation CLI cannot express the structured none/reason promotion manifest needed for closure. This tool limitation does not represent unfinished implementation or local acceptance.
