---
id: design-effect-boundaries
kind: design
title: Pure logic and side-effect boundaries
status: active
created: '2026-10-03'
scope_type: policy
responsibilities: []
invariants: []
boundaries:
  provides: []
  consumes: []
  forbidden: []
variability:
  fixed: []
  free: []
capabilities: []
failure_responsibilities: []
trust_boundaries: []
compatibility_policies: []
tags: []
owners: []
relations: []
source_paths:
- lib/domain
- lib/application
- lib/ui
- lib/adapters
- lib/server
- scripts/lint
- AGENTS.md
summary: Dependency direction and verification rules for pure functions, ports and adapters.
---

## Purpose

Separate pure state decisions from side effects so behavior can be verified without depending on a runtime. Do not preserve a boundary defect merely to keep a diff small.

## Responsibilities

The domain handles input validation, state transitions, and date and relationship projections. The application advances workflows through ports. Adapters perform DB, DOM, communication, time and ID side effects. The composition root injects concrete implementations.

## Boundaries

The domain and UI model do not depend on concrete adapters. The application references only ports and pure models. The UI controller owns state and operation flow; the DOM adapter handles display and event wiring.

## Invariants

Verify deterministic results for identical inputs and that inputs are not mutated. Preserve owner isolation, atomicity, revisions, identical-request retries and Undo that respects later corrections. Do not reinterpret an unknown result as a failed save; retain the original request ID and input.

## Collaboration

Apply shared port contracts to production adapters and test mocks. Do not infer authentication or host UI behavior, which only runs in the real environment, from local test results.

## Failure responsibility

Adapters make uncertainty in communication and persistence explicit. The application retains unsaved edits and requests and provides recovery paths. The verification harness does not report unrun, skipped or failed checks as success.

## Variability

Concrete port implementations, test fixtures and internal module placement can change. Preserve dependency direction, purity, existing data and public state contracts. State migration and acceptance criteria explicitly when changing them.

## Conformance

Verify with boundary lint, type checking, pure-function tests, shared port contracts, controller tests, generated HTML tests and independent review. Static checks alone do not prove the absence of every side effect.

## Related decisions

Development and verification procedures are in `docs/technical/testing.md`; working instructions are in the root `AGENTS.md`.
