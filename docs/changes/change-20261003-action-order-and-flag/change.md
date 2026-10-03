---
id: change-20261003-action-order-and-flag
kind: change
title: Replace tasks and dependencies with ordered actions and direct flags
status: active
created: '2026-10-03'
profile: sdd@1
intent: Simplify Ariadne to ordered actions with direct flags and parent-child containment
  only.
outcomes:
- Actions replace tasks across storage, APIs and UI.
- Sibling order never blocks execution; direct flags never inherit.
- Disposable test data and retired receipts reset in migration 0009.
scope:
- lib/
- app/
- db/
- drizzle/
- tests/
- scripts/
- docs/technical/
- docs/design/state-and-perspectives.md
- skills/action-tools/
- AGENTS.md
- ARCHITECTURE.md
- README.md
- PRODUCT.md
- docs/development.md
- docs/design/design-action-state-and-perspectives.md
non_goals:
- Flag inheritance
- Sequential or parallel modes
- Backward compatibility or fallback
- Hosted deployment or remote DB reset
change_classes:
- behavior
- boundary
- invariant
governance:
  gate: auto
  reasons: []
members:
- role: requirements
  path: changes/change-20261003-action-order-and-flag/requirements.md
  required: true
- role: implementation
  path: changes/change-20261003-action-order-and-flag/implementation.md
  required: true
- role: verification
  path: changes/change-20261003-action-order-and-flag/verification.md
  required: true
promotion: []
unresolved_decisions: []
tags: []
owners: []
relations:
- {type: introduces, target: design-action-state-and-perspectives}
source_paths:
- lib/domain/core.ts
- lib/application/action-service.ts
- lib/adapters/d1-action-store.ts
- app/mcp/route.ts
- lib/ui/adapters/dom.js
- db/schema.ts
summary: Replace the task/dependency contract with ordered actions and direct boolean
  flags.
updated: '2026-10-03'
---

# Ordered actions and direct flags

The user requested a simpler model: containment only, intended sequence through action order, no prerequisite gates or sequential/parallel modes, and direct flags without inheritance. The task concept becomes action throughout current code, storage, tools, HTTP and UI. The user permits resetting disposable test data and rejects backward compatibility.

New documentation and comments are English. The user explicitly authorized skipping the incompatible Development Loop execution framework for this change; implementation and verification run directly. Existing Site, DB binding and private access remain unchanged. Hosted deployment is outside this change's execution.

The implementation is recorded in the package members. Historical completed packages and old migration files remain historical; the new state design supersedes the former prerequisite model.

## Rollout

Local implementation and verification do not apply migration 0009 to hosted D1. A requested release must stop old writes, apply the reset migration, publish the new Worker, reload clients and verify actual host resources.
