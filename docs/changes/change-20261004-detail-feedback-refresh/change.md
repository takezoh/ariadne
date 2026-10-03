---
id: change-20261004-detail-feedback-refresh
kind: change
title: Local field feedback and integrated Refresh save state
status: active
created: '2026-10-04'
profile: sdd@1
intent: Make detail feedback local and concise and share one header control for Refresh
  and saving.
outcomes:
- Flag is visually distinct from lifecycle controls while remaining on the right.
- Editable fields expose nearby accessible validation.
- Refresh combines stable action semantics and global save state.
scope:
- UI presentation, pure validation feedback and targeted regression evidence
non_goals:
- Backend changes, database migration, broad drag testing and deployment
change_classes:
- behavior
- implementation_only
governance:
  gate: auto
  reasons: []
members:
- role: requirements
  path: changes/change-20261004-detail-feedback-refresh/requirements.md
  required: true
- role: implementation
  path: changes/change-20261004-detail-feedback-refresh/implementation.md
  required: true
- role: verification
  path: changes/change-20261004-detail-feedback-refresh/verification.md
  required: true
promotion: []
unresolved_decisions: []
tags: []
owners: []
relations: []
source_paths:
- lib/ui/model/autosave.ts
- lib/ui/model/catalog-drafts.ts
- lib/ui/model/date-input.ts
- lib/ui/adapters/dom.js
- lib/widget.ts
- tests/ui/dom.test.mjs
- tests/ui/date-input.test.mjs
- scripts/testing/smoke-built-widget.mjs
- ARCHITECTURE.md
summary: Keep field errors local, separate lifecycle and Flag visually, stabilize24-hour
  clock display, and combine global save feedback with Refresh.
updated: '2026-10-04'
---

## Summary

## Closure Notes

Local implementation and acceptance are complete.336 full tests, lint/typecheck, build, both built UI resources, fresh read-only preview, independent six-layout review and focused functional checks passed. See [verification](verification.md).

Structured closure disposition cannot be represented by the CLI scalar transition interface; state remains active with local completion recorded here. Native Profiles were used without a kernel receipt. Machine Git scope ingestion remains UNKNOWN; no unperformed manual Git scope check or hosted acceptance is claimed.

Native implementation preserves the existing serial autosave, raw proposals, known/unknown receipt recovery, classification and calendar contracts.


{% transition from="draft" to="ready" date="2026-10-04" %}
Native bounded implementation frozen; focused UI135 and six-layout functional evidence passed.
{% /transition %}


{% transition from="ready" to="active" date="2026-10-04" %}
Root integration check/build and fresh artifacts are in progress; source stays frozen.
{% /transition %}
