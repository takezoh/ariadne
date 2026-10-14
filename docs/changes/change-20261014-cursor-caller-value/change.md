---
id: change-20261014-cursor-caller-value
kind: change
title: Verify cursor-based caller continuation with real local state
status: active
created: '2026-10-14'
profile: sdd@1
intent: Provide reproducible VALUE-1 through VALUE-4 observations using actual fresh
  model callers, generated UI events and the real local Worker D1 binding, with a
  fair full-state baseline.
outcomes:
- Read-only callers cannot invoke any published mutating MCP tool.
- Write-enabled callers can narrow apply_change kinds, action IDs and payload fields.
- A checkpoint requires successful caller output plus a cursor observed on a complete
  snapshot or terminal feed page.
- Harness preparation and synthetic UI simulation remain separate from actual caller-value
  acceptance.
- Compare actual full-state and incremental outputs fairly; report parity rather than
  inferring superiority from payload size.
- Actual independent model outputs demonstrate UI correction uptake, AI result handoff,
  restored context and context-loss limits; independent assessment approved this bounded
  contribution with no findings.
scope:
- scripts/testing/caller-value-bridge.mjs
- scripts/testing/caller-value.mjs
- tests/harness/caller-value-bridge.test.mjs
- docs/technical/testing.md
- docs/changes/change-20261014-cursor-caller-value/**
- docs/evidence/20261014-cursor-caller-value-preparation.json
- docs/usage/agent-workflows.md
- docs/evidence/20261014-cursor-caller-value.md
- docs/evidence/20261014-cursor-caller-value.json
non_goals:
- Product API or persistence changes.
- Hosted deployment, physical-human or ChatGPT Work acceptance, universal model guarantees
  and long-term human-benefit claims.
change_classes:
- internal_design
governance:
  gate: auto
  reasons: []
members:
- role: requirements
  path: changes/change-20261014-cursor-caller-value/requirements.md
  required: true
- role: implementation
  path: changes/change-20261014-cursor-caller-value/implementation.md
  required: true
- role: verification
  path: changes/change-20261014-cursor-caller-value/verification.md
  required: true
promotion: []
unresolved_decisions: []
tags: []
owners: []
relations:
- {type: conformsTo, target: design-assistance}
source_paths:
- scripts/testing/caller-value-bridge.mjs
- scripts/testing/caller-value.mjs
- tests/harness/caller-value-bridge.test.mjs
- docs/technical/testing.md
- docs/usage/agent-workflows.md
- docs/evidence/20261014-cursor-caller-value.md
summary: Deliver the bounded caller bridge and paired synthetic model observations;
  independent assessment and parent combined acceptance remain distinct.
updated: '2026-10-14'
---

# Cursor-based caller continuation

This package records the Issue #20 caller-value contribution to parent Issue #16: a bounded local bridge, real generated UI events, actual independent model callers and a paired full-state comparison. The shared-state API prerequisite is commit `4a30365d3eb750bfb1bf2f43b0e4b5403a9609c8`; product persistence and API behavior are unchanged here.

The main session for this unit operated the actual callers and local Worker. Harness tests alone do not establish model interpretation. The [synthetic observation report](../../evidence/20261014-cursor-caller-value.md) separates actual observations, failures, source applicability and unperformed environments. Parent Issue #16 retains combined API/caller acceptance.

## Current result

All four requested VALUE scenarios have actual local observations. Both incremental and full-state consumers incorporated the correction and result, and both recovered current state after context loss while limiting claims about unsaved preferences. The comparison supports parity in this bounded fixture, not a universal advantage or long-term reduction in user effort. Independent final assessment approved this bounded contribution with no findings. Parent combined acceptance remains separate.

`pnpm check` passed 478 tests with no failed, cancelled, skipped or TODO tests; `pnpm build` passed. The dedicated bridge suite passed eight tests. Generated UI and tool effects used actual local Wrangler Worker `env.DB`; no hosted deployment, trusted Sites identity, physical-human or ChatGPT Work acceptance is claimed.


{% transition from="draft" to="ready" date="2026-10-14" %}
Captured caller criteria and reproducible harness are documented; actual local observations are recorded.
{% /transition %}


{% transition from="ready" to="active" date="2026-10-14" %}
Implementation and local observations are complete; independent final assessment remains pending.
{% /transition %}
