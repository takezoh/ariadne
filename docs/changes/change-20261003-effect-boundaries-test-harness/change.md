---
id: change-20261003-effect-boundaries-test-harness
kind: change
title: Separate side-effect boundaries and add a development verification harness
status: active
created: '2026-10-03'
profile: sdd@1
intent: Separate pure logic and side effects by responsibility, boundary and structure; enforce dependency direction and verification.
outcomes:
- Isolate side effects behind ports/adapters and test domain/UI state decisions as pure functions.
- Verify production adapters and mocks against shared contracts; preserve persistence, retries, Undo and owner isolation.
- Use one lint/typecheck/test harness that rejects failures, unrun tests and skips.
scope:
- lib/**
- app/**
- scripts/**
- tests/**
- build/**
- eslint.config.mjs
- package.json
- tsconfig.json
- AGENTS.md
- ARCHITECTURE.md
- docs/technical/**
- docs/development.md
- .github/workflows/**
- db/index.ts
- docs/design/design-effect-boundaries.md
- docs/issue/issue-20261003-legacy-note-frontmatter.md
non_goals:
- Production deployment, visibility changes, existing-data deletion or DB schema migration.
- Repeat device acceptance in ChatGPT Work or long-term benefit evaluation.
change_classes:
- responsibility
- boundary
- dependency
- internal_design
governance:
  gate: auto
  reasons: []
members:
- role: requirements
  path: changes/change-20261003-effect-boundaries-test-harness/requirements.md
  required: true
- role: implementation
  path: changes/change-20261003-effect-boundaries-test-harness/implementation.md
  required: true
- role: verification
  path: changes/change-20261003-effect-boundaries-test-harness/verification.md
  required: true
promotion: []
unresolved_decisions: []
tags: []
owners: []
relations:
- {type: introduces, target: design-effect-boundaries}
source_paths:
- lib
- app
- scripts
- tests
- eslint.config.mjs
- package.json
- AGENTS.md
summary: Separate TaskStore, UI controller and side-effect adapters; add boundary lint and a verification harness that rejects unrun tests.
updated: '2026-10-03'
---

## Summary

Implement side-effect separation and lint/test harnesses. Replace internal structure while preserving saved data and public contracts.

## Closure notes

Repaired the format of existing notes and closure metadata for a past MVP with user approval; ordinary repository-wide docs lint passed. Formal closure was not completed because conformance issues remain in existing documents. Distinguish integrated code verification from conformance of all documentation.
