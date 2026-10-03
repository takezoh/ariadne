---
id: design-action-state-and-perspectives
kind: design
title: Action state, order, flags and perspectives
status: active
created: '2026-10-03'
scope_type: area
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
compatibility_policies:
- The action model resets disposable test data and receipts; no old task or dependency
  fallback is provided.
tags: []
owners: []
relations:
- {type: references, target: design-product}
- {type: references, target: design-assistance}
source_paths:
- db/schema.ts
summary: Actions use containment and sibling rank without execution constraints; flags
  are direct state.
---

# Action state, order, flags and perspectives

## Purpose and responsibilities

Keep durable user intent, deterministic projection, and host recommendations separate. Ariadne owns validated persistence and mechanical state transitions; The user and caller-side LLM own meaning, management method and candidate selection. ChatGPT is the current delivery environment; prompts, dot and caller-side schedulers use the same data tools. Conversation and UI share one action store rather than copying actions per perspective.

## Boundaries

Domain consumes an explicit snapshot, operation and timestamp and provides pure validation/transitions/projections. Application consumes store/clock/ID ports and provides owner-scoped operations. D1 provides atomic revision CAS, delta writes, receipts and pruning. UI consumes the same API and preserves proposals and unknown requests. No layer introduces independent prerequisite dependencies, execution modes or a recommendation LLM.

Project/tag classification is separate from action containment. A project hierarchy organizes classification; it does not inherit completion, Defer, membership, or flags. IDs identify records; names and paths are display/input forms.

## Invariants

- INV-ACTION-001: Relationships between actions are parent-child containment only; missing parents and cycles are rejected.
- INV-ACTION-002: Order expresses intended sibling sequence and never restricts execution, completion or visibility. Roots share a project or unassigned scope; ties use stable IDs.
- INV-ACTION-003: Flagged is directly specified boolean state, false by default; parent/project flags never propagate. Changing it preserves lifecycle, Due and Defer.
- INV-ACTION-004: Parent Defer affects projection without overwriting child dates. Parent completion atomically completes descendants; child completion never automatically completes the parent.
- INV-ACTION-005: Explicit on-hold and Defer remain separate. A normal view includes unfinished nondeferred actions, including on-hold. Host recommendations do not replace the complete normal list.
- INV-ACTION-006: Identity, revision, exact-request replay, unknown-outcome recovery and conflict-aware Undo apply to order and flags as to other action properties.

## State and perspectives

Lifecycle is active/on-hold/completed/dropped. Original unresolved input is an ordinary action retaining the caller's title and raw notes; saving does not manufacture an execution commitment. Inbox is unfinished project-unassigned actions, including deferred ones. Waiting is explicit on-hold, not a prerequisite-derived projection.

Defer determines temporary visibility on read; Due is a deadline. Neither is a planned-work date. Date-only Defer resolves 09:00 in the explicit client timezone to a durable UTC instant. Expiry does not rewrite state or reopen work.

The normal Flag scope is the intersection of direct flagged and normal view. General flagged queries can retrieve deferred/completed/dropped records without changing them. A marked parent does not implicitly mark children. Flags survive completion, withdrawal and reopening until explicitly changed.

Ordering permits gaps and equal ranks. Omitted order appends after the maximum rank in its scope. Parent moves, and root project moves, append at the destination; explicit parent-edit order overrides append. Projection groups roots by project ID and walks ordered sibling groups parent-first. A later action can be completed while all earlier siblings remain active or on-hold.

## Collaboration and failure responsibility

Only trusted server authentication determines owner. All changes use the shared API and atomic store path. Preview reveals effects without reserving state. Unknown results preserve exact operation ID/input for receipt lookup or replay. Dirty UI title/notes/order/flag proposals survive refresh and host notifications. Undo rejects later changes to the affected action and protects unrelated records.

Hosted D1 and ChatGPT resources are distinct acceptance boundaries. Local mocks cannot prove host caching, authentication injection or actual conversation behavior.

## Variability and compatibility

Current fixed choices are direct-only flags, containment, unconstrained sibling sequence and existing lifecycle/date semantics. Potential future flag inheritance needs a separate design decision. Planned and estimates are unsupported data fields. Notification, scheduling and external observation belong to caller workflows, not Ariadne services; callers can use the published operations without specialized integrations.

Migration 0009 intentionally resets authorized disposable test data, including prior operations/catalog reservations. There is no old task-name alias, dependency payload conversion, fallback or pre-reset replay/Undo. Preserve the existing Site, DB binding and private scope; hosted cutover requires a separate deployment operation.

## Conformance

Verify pure transitions and input preservation; SQLite/defaults/reset/CAS/atomicity; receipt/replay/Undo/owner isolation; and actual generated UI proposal retention, rank/flag controls and result recovery. The repository gate is pnpm check plus pnpm build. Hosted rollout must verify actual tools/resources and UI behavior on the deployed version.

Sources: [data model](../technical/data-model.md), [API](../technical/mcp-api.md), [testing](../technical/testing.md), [change](../changes/change-20261003-action-order-and-flag/change.md).

## Filter-only saved views

A saved perspective is owned by one authenticated user and contains extraction conditions only. Owner is mandatory in storage; queries and references stay within that owner. It does not define another order, grouping or display configuration.

Evaluation preserves the existing action-tree relative order and never duplicates actions or changes their state. Status sets, direct Flag, read-time Defer and explicit Project/Tag membership are mechanical conditions, not recommendations. Classification descendant expansion is distinct from action containment. Parent actions that fail the filter are not automatically included as matches.

Stored definitions are dynamic: edits, classification changes and Defer expiry affect the next read. Filter edits replace the definition. Removal and Undo use ordinary revision, receipt and identity guarantees; missing references must not silently widen the view. Definitions and returned matches remain separate from host recommendations.
