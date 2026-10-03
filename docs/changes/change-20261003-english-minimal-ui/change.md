---
id: change-20261003-english-minimal-ui
kind: change
title: English minimal action workspace
status: active
created: '2026-10-03'
profile: sdd@1
intent: Replace the user-rejected presentation with a quiet English action workspace
  while preserving shared data and recovery contracts.
outcomes:
- Quiet English workspace provides narrow and full display with selected-only details
  and accessible coherent icons.
- Drafts and exact-request recovery survive refresh, conflicts and display changes
  without translating stored text.
scope:
- lib/widget.ts
- lib/ui/
- app/board.tsx
- app/layout.tsx
- app/mcp/route.ts
- tests/ui/
non_goals:
- No domain or storage changes
- No deployment or infrastructure changes
- No dependency changes or user-data translation
change_classes:
- behavior
- internal_design
governance:
  gate: auto
  reasons: []
members:
- role: requirements
  path: changes/change-20261003-english-minimal-ui/requirements.md
  required: true
- role: implementation
  path: changes/change-20261003-english-minimal-ui/implementation.md
  required: true
- role: verification
  path: changes/change-20261003-english-minimal-ui/verification.md
  required: true
promotion: []
unresolved_decisions: []
tags: []
owners: []
relations:
- {type: conformsTo, target: design-action-state-and-perspectives}
source_paths: []
summary: English UI with a continuous neutral workspace, selected-only details, narrow
  display navigation and typed recovery copy.
updated: '2026-10-03'
---

## Summary

Replace the rejected presentation with an English action workspace and preserve recovery and saved data contracts.

## Closure Notes

The native author, independent design review, implementation and independent implementation review completed. Combined check passed all 219 tests with no failures, cancellations, skips or TODOs; build and both built UI resource checks passed. New browser evidence covers narrow/full light/dark presentation, capture, review and unknown-result states. The local preview is available for user inspection.

The standard development-loop kernel was not executed and no kernel success receipt is claimed. Hosted deployment and actual ChatGPT Work acceptance remain outside this change. No UI source changes were made while recording final evidence.

Package lifecycle remains active because the current documentation CLI only appends scalar list values and cannot express the structured none/reason promotion manifest required for closure. This documentation-tool limitation does not represent unfinished UI implementation or local validation.
