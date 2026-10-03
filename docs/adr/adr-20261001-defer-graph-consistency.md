---
id: adr-20261001-defer-graph-consistency
kind: adr
title: Project Defer at read time and serialize updates per user
status: accepted
created: '2026-10-01'
decision_makers:
- main-session (based on the user's direction to continue the design)
tags: []
owners: []
relations:
- {type: references, target: change-20261001-structured-todo-mvp}
source_paths: []
summary: MVP technology selection. Live connection and cost evidence gates were not run. The contract is defined in implementation.md.
confirmation: Verify selection conditions and counterexamples with T0/T1/T2/T5 contract and scenario checks. Not run.
updated: '2026-10-01'
---

# Project Defer and update consistency per user

## Context and rationale

Under user-approved C1–C4, a parent's Defer applies to descendants while preserving each child's date. Resolving a dependency does not clear Defer, and a parent with incomplete descendants cannot be completed. The [requirements](../changes/change-20261001-structured-todo-mvp/requirements.md) must be preserved.

## Decision

Keep parent-child, dependency and individual Defer as separate sources of truth. Calculate the displayed state at read time from a complete snapshot and a fixed `now`. Update the per-user revision in a transaction for every write, and preserve the receipt and audit delta in that same transaction. Validate matching revisions around a complete snapshot read. Undo verifies the version of changed items and invariants after the inverse operation.

## Alternatives and disposition

Copy effective Defer to every child: rejected initially because editing/moving ancestors and Undo would require more writes and could partially fail. Use a scheduler/TTL to release items: rejected because redisplay would depend on external triggers or delay. Check versions only on changed documents: rejected because the contract would not prevent completing a parent while adding a child or concurrent cycle creation. Store the whole graph in one document: rejected because of document size limits and growing history.

## Consequences

- Positive: No write or independent LLM is needed when time arrives. Parent Defer, child dates, dependencies and completion retain their meanings.
- Negative: Full-graph reads scale with accumulated data, and revision checks can cause writes by one user to conflict.
- Neutral: Conservative consistency for a personal MVP, without cross-user locking. Calendar support requires a separate boundary design.

## Confirmation and invalidation conditions

At T1, test counterexamples for S04–S13. At T2, test concurrent parent/child and dependency changes and retry after lost responses. At T5, measure cost and contention. If snapshot completeness cannot be guaranteed, do not proceed with partial results. Revise the snapshot/index approach if cost or contention is unacceptable.

## Sources

[Firestore transactions](https://firebase.google.com/docs/firestore/manage-data/transactions), [Firestore best practices](https://firebase.google.com/docs/firestore/best-practices), and [accepted product decisions](../changes/change-20261001-structured-todo-mvp/decision-evidence.json).

## Application to Sites/D1 after Work measurements

Keep read-time projection, complete snapshots, per-user revisions, atomic receipt/history persistence and Undo invariants. Replace the transaction adapter with the conditional D1 batch in the current [implementation](../changes/change-20261001-structured-todo-mvp/implementation.md). Firestore-specific cost and cold-start evaluation are not acceptance criteria for Work. The original confirmation section is design history; prioritize the latest acceptance scope and Work evidence.
