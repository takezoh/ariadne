---
change: change-20261003-product-rename-generic-identifiers
role: implementation
---

<!-- lifecycle is owned by change.md -->

# Implementation

## Code and configuration

- app/mcp/route.ts publishes the generic tool names, generic Japanese titles, serverInfo action-tools, generic resource names and generic descriptions. The storage error log no longer names the product.
- lib/application/action-service.ts, lib/ui/application.ts, lib/ui/adapters/verification.ts and scripts/testing/smoke-built-widget.mjs use the generic tool names.
- lib/widget.ts and lib/verification-widget.ts use ui://action-tools/ resources; the widget title and header show アクション.
- lib/domain/assistance.ts refers to "these tools", "the server" and "this service" instead of a product name.
- lib/ui/adapters/dom.js, app/board.tsx and app/layout.tsx use generic app, host and page names.
- package.json, scripts/migrate-local.mjs, scripts/testing/run-tests.mjs and eslint.config.mjs use generic names.
- skills/action-tools/SKILL.md moved to skills/action-tools/SKILL.md with a generic name, description and prose.

## Storage

- drizzle/0012_generic_revision_guard.sql drops and recreates operations_revision_guard with the same condition and the revision_conflict marker. The snapshot and journal were generated with drizzle-kit as a custom migration.
- lib/adapters/d1-action-store.ts classifies conflicts by revision_conflict.
- tests/helpers/sqlite-d1.mjs applies 0012 for current-state fixtures and omits it for fixtures that start before earlier migrations.

## Tests

- tests/ui/mcp-display.test.mjs asserts the exact published tool set.
- tests/adapters/atomic-row-storage.test.mjs asserts the trigger marker and that a stale commit is a conflict without writes.
- Existing tests use generic tool names, bindings and temporary-directory prefixes. The retired task-era tool assertion uses list_tasks.

## Documentation

README, PRODUCT, ARCHITECTURE, AGENTS.md, the development guide, technical references and active designs name the product as selected at that time and use generic identifiers. AGENTS.md states the naming rule. The deployment guide describes migration 0012 and the identifier switch. The historical brief's current-entry notice maps the earlier name to the then-current product name.
