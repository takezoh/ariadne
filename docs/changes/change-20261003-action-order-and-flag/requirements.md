---
change: change-20261003-action-order-and-flag
role: requirements
---

# Requirements

- FR-001: Ariadne SHALL call its product entity action across types, store, HTTP, MCP and UI, without old-name aliases.
- FR-002: Ariadne SHALL support parent-child containment only; independent prerequisite operations and projections SHALL be absent.
- FR-003: Each action SHALL store a nonnegative safe-integer order; reads SHALL use sibling rank and stable-ID tie breaking. Roots SHALL be grouped by project or unassigned scope.
- FR-004: When an action is appended or moved without explicit rank, Ariadne SHALL append within its destination scope. Later siblings SHALL remain executable and completable regardless of earlier siblings' state.
- FR-005: Each action SHALL store a direct boolean flagged value, false by default. Ariadne SHALL NOT inherit flags or change status/dates because of them.
- FR-006: Order/flag changes SHALL participate in atomic revision, identical replay and conflict-aware Undo contracts.
- FR-007: Migration 0009 SHALL reset authorized test data/history and remove tasks, task_tags and dependencies; runtime SHALL NOT convert or fall back to old contracts.
- FR-008: UI refresh and host notifications SHALL preserve dirty order/flag/title/notes proposals and unknown-result requests.
- INV-001: Existing parent Defer, parent completion, client-timezone Defer, owner isolation and no-duplicate-retry guarantees SHALL remain, except the retired prerequisite-derived C4 clause.

Acceptance: verify later-first completion, independent parent/child flags, Defer preservation, defaults/rank moves/ties, strict values, real SQL boolean/rank round trips, both-owner reset, replay/Undo conflicts and generated DOM controls. Run pnpm check and pnpm build. Hosted deployment/remote reset, inherited flags and saved perspectives are not requested.
