---
id: adr-20261001-sites-d1-work-mvp
kind: adr
title: Move the MVP to Sites and D1 based on Work evidence
status: accepted
created: '2026-10-01'
decision_makers:
- unknown
- main-session (based on the user's design direction after verification)
tags: []
owners: []
relations:
- {type: supersedes, target: adr-20261001-cloud-run-firestore}
- {type: references, target: change-20261001-structured-todo-mvp}
source_paths: []
summary: Select the platform based on evidence of the Work UI, conversation and D1 round trip; state MVP gaps and two defects explicitly.
updated: '2026-10-01'
---
# Select Sites + D1 as the MVP platform

## Context

Avoiding custom cloud operations and providing a dedicated UI inside ChatGPT are user direction. The [Work evidence](../note/note-20261001-work-m0-sites-proof.md) measured round trips through the MCP Apps UI, conversation, D1 and restoration in another conversation, satisfying the earlier feasibility gate for the primary path.

## Decision

Choose Sites + D1 + the MCP Apps UI inside Work, superseding the Cloud Run + Firestore ADR. Continue using the existing Site/Plugin. Preserve the boundary where the server determines the owner, along with the invariants for read-time Defer and per-user revisions. Atomically save business updates, immutable receipts and history with a conditional D1 batch. Keep dirty drafts separate from snapshot updates. See the [implementation contract](../changes/change-20261001-structured-todo-mvp/implementation.md).

## Alternatives

Cloud Run + Firestore: not measured end to end and adds another cloud to operate, so it is deferred as an alternative. Pages alone: rejected because prior evidence showed it could not enforce the parent-completion invariant. M0 `last_request`: rejected because it did not fix BUG-01. Replacing input during UI refresh: rejected because of BUG-02.

## Consequences

- Positive: Reuses a Work connection already demonstrated and avoids adding custom AWS/GCP infrastructure.
- Negative: Depends on Sites runtime/Plugin contracts and D1. Requires importing the verified source and implementing migrations and new transactions.
- Neutral: M0 acceptance is not MVP acceptance. Two defects, unimplemented features and the Work unknown-outcome test remain. Authentication and platform unit acceptance are outside this scope, but required implementation boundaries remain.

## Confirmation

Measure Work regressions for BUG-01/02, in-scope C1–C4 and S01–S16 behavior, timeout, input retention and retry with the same ID. If conditional batches are unavailable, redesign the adapter contract; do not weaken it to allow partial writes.
