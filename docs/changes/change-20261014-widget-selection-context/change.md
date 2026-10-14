---
id: change-20261014-widget-selection-context
kind: change
title: Typed widget selection context
status: draft
created: '2026-10-14'
profile: sdd@1
intent: Expose the explicit selection of a loaded widget so a caller can inspect current
  UI context without backend effects.
outcomes:
- Widget-local get_selection_context returns the latest confirmed basic context with
  typed active and explicit selected items, per-instance identity and semantic freshness.
- Host-to-App requests dispatch before same-ID outbound responses while preserving
  response recovery and unknown write arguments.
- Action-only bulk mutation guards reject mixed, missing and local selections as a
  whole.
scope:
- lib/ui
- tests/ui
- tests/harness/architecture-fixtures.test.mjs
- scripts/testing/smoke-built-widget.mjs
- docs/technical
non_goals:
- Durable database, HTTP, authentication, public server-tool registry or standalone
  local registry changes.
- Deployment or claims of actual ChatGPT Work tool discovery and caller-to-widget
  routing.
change_classes:
- behavior
- responsibility
- boundary
- internal_design
- capability
governance:
  gate: auto
  reasons: []
members:
- role: requirements
  path: changes/change-20261014-widget-selection-context/requirements.md
  required: true
- role: implementation
  path: changes/change-20261014-widget-selection-context/implementation.md
  required: true
- role: verification
  path: changes/change-20261014-widget-selection-context/verification.md
  required: true
promotion: []
unresolved_decisions: []
tags: []
owners: []
relations: []
source_paths:
- lib/ui/model/interaction.ts
- lib/ui/model/selection-context.ts
- lib/ui/application/controller.ts
- lib/ui/effects/host.ts
- lib/ui/effects/dom.js
- tests/ui
- scripts/testing/smoke-built-widget.mjs
- tests/harness/architecture-fixtures.test.mjs
summary: Expose the loaded widget's typed explicit selection through a local read-only
  App tool.
---

## Summary

Add a widget-local, read-only `get_selection_context` App tool that returns a
typed snapshot of the loaded widget's current explicit selection and active
inspector. The response is based on the latest confirmed UI snapshot, carries a
loaded-widget instance ID and a semantic context version, and exposes only
basic item fields. Empty explicit selection stays empty; the active inspector
is reported separately.

The local tool is dispatched inside the widget and never calls the server tool
registry. Host requests are routed before same-ID pending response matching.
Bulk Action operations require the full explicit selection to contain only
eligible saved Actions, while preserving selection proposals and unknown-write
recovery behavior.

## Closure Notes

Implementation and local verification are complete. The change-scoped
`out-of-scope-changes.v2` and `closure.evidence-readiness.v1` checks pass.
Independent review and lifecycle closure remain with the change owner. The
local built Worker harness verifies the compiled resource and mocked host
protocol; it does not establish ChatGPT Work discovery, routing, or tool
behavior. No backend, database, authentication, deployment, or public
server-tool changes are included.
