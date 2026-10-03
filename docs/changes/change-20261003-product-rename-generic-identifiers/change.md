---
id: change-20261003-product-rename-generic-identifiers
kind: change
title: Rename the product and generalize source identifiers
status: active
created: '2026-10-03'
profile: sdd@1
intent: Name the product in documentation while source code, tool names,
  resource URIs, the Skill and the database trigger use generic identifiers that contain
  no product name.
outcomes:
- Current documentation uses the product's current name.
- Source code, tests, scripts, configuration, MCP tool names, UI resource URIs and
  the Skill contain no product name.
- A new migration redefines the revision guard with a generic marker; conflict classification,
  replay, Undo and owner isolation keep their guarantees.
- The published tool list contains exactly the generic names without aliases.
scope:
- app/
- lib/
- scripts/
- tests/
- drizzle/
- skills/
- eslint.config.mjs
- package.json
- README.md
- PRODUCT.md
- ARCHITECTURE.md
- AGENTS.md
- docs/development.md
- docs/technical/
- docs/design/product.md
- docs/design/assistance.md
- docs/design/design-action-state-and-perspectives.md
- docs/research/product-brief.md
- docs/changes/change-20261003-product-rename-generic-identifiers/
non_goals:
- Renaming the GitHub repository, Sites project, DB binding, worktree paths or hosted
  plugin listing
- Editing applied SQL migrations or historical documents
- Compatibility aliases for previous tool names or resource URIs
- Hosted migration, deployment, commit or push
change_classes:
- behavior
- boundary
governance:
  gate: auto
  reasons: []
members:
- role: requirements
  path: changes/change-20261003-product-rename-generic-identifiers/requirements.md
  required: true
- role: implementation
  path: changes/change-20261003-product-rename-generic-identifiers/implementation.md
  required: true
- role: verification
  path: changes/change-20261003-product-rename-generic-identifiers/verification.md
  required: true
promotion: []
unresolved_decisions: []
tags: []
owners: []
relations:
- {type: modifies, target: design-product}
- {type: modifies, target: design-assistance}
source_paths:
- app/mcp/route.ts
- lib/adapters/d1-action-store.ts
- lib/domain/assistance.ts
- lib/widget.ts
- lib/ui/application.ts
- skills/action-tools/SKILL.md
- drizzle/0012_generic_revision_guard.sql
summary: Product naming updated in documents; source identifiers, MCP tool names,
  UI resource URIs, Skill name and revision-guard marker generalized.
updated: '2026-10-03'
---

# Rename the product and generalize source identifiers

## Summary

On 2026-10-03 the user requested a product rename, chose the full scope including published identifiers, and directed that source code use neither product name. Documentation used the selected product name. Code, tests, scripts, configuration, MCP tool names, UI resource URIs, the Skill and the revision guard use generic identifiers such as action-tools and list_actions. The current product name is Ariadne.

The tool and resource renames are a breaking external contract change without aliases. Migration 0012 changes only the revision guard's raised marker. Hosted migration, deployment and host acceptance are outside this change.

## Closure Notes
