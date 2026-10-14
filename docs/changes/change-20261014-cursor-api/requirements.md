---
change: change-20261014-cursor-api
role: requirements
---

<!-- lifecycle is owned by change.md -->

# Requirements

This package implements the API-1 through API-7 cursor-api unit. Consumers own their cursor and contextual interpretation; the service returns persisted facts and safe positions. Requests authenticate on every call, SQL remains bound to the current trusted owner, and the caller cannot select an owner.

## Functional contract

- **FR-001 — Baseline:** `get_change_cursor {}` returns the authenticated owner's current revision as an opaque baseline. A baseline does not assert that the consumer has fetched the corresponding snapshot.
- **FR-002 — Bootstrap:** A complete snapshot returns `change_cursor` and `action_tags` from the same atomic owner snapshot revision. Consumers reconstruct a canonical cache from explicit persisted fields, not derived tags, paths, scopes, view values, or action lifecycle projections. Filtered queries are not complete bootstrap snapshots.
- **FR-003 — Persisted operations:** `get_changes {cursor, page_size?}` returns complete retained operations in ascending owner revision. Each operation preserves operation identity, revision bounds, commit time, Undo identity, and exact before/after values for Actions, Projects, Tags, Perspectives, and action_tags. Each type is present as an array; untouched types are empty. Association changes are keyed by action/tag pair. Deletions retain their prior identity and value. Operations are not coalesced.
- **FR-004 — Page bounds:** `page_size` defaults to 20 and accepts integers from 1 through 100. Pages never split an operation, and the serialized logical `ChangePage` object is limited to 1 MiB of UTF-8 JSON. The MCP dispatcher returns the same page as both `structuredContent` and `content[0].text`; therefore the complete JSON-RPC HTTP response body may exceed 1 MiB. No total wire-body limit is part of this contract. A fixed through-revision fence keeps a multi-page read stable; a record that cannot fit alone fails without advancing.
- **FR-005 — Terminal and empty positions:** An empty owner or current cursor returns `changes: []` and `has_more: false`. Every terminal token positions at the observed head with no fence, including an empty page, so a subsequent call can observe the next H+1 write. Intermediate pages retain the original fence.
- **FR-006 — Retention and failure:** Valid position `P` satisfies `max(0, oldest_retained_revision - 1) <= P <= current_revision`. Invalid, malformed, noncanonical, wrong-owner/scope, future, unsupported, or expired cursors return explicit errors. A pruned fence, malformed historical delta, or missing/noncontiguous retained revision fails explicitly; the API never reports partial history as complete or silently jumps to latest.
- **FR-007 — Read-only recovery:** Reads do not write consumer progress or mutate business state, owner revision, receipts, identity markers, completion, read status, or saved dates. Consumers advance their own checkpoint only after successfully processing a page and retry with the exact prior cursor after failure. Existing proposal retention and unknown-write-result recovery remain intact.

## Acceptance criteria

- **API-1:** From a baseline, create, edit, remove, and Undo every public collection and relationship; replay full operations into the persisted cache and compare with the authoritative snapshot. Cover Actions, Projects, Tags, Perspectives, and action_tags, including deletion identities.
- **API-2:** Verify empty-owner and current-position reads return an empty change list with `has_more=false`; use the returned terminal token to observe a subsequent H+1 write.
- **API-3:** Keep consumer A and B at independent positions. A's reads or local checkpoint changes do not advance B; foreign-owner cursors fail and SQL remains owner-isolated.
- **API-4:** Page a fixed H while writes occur between pages; retry an exact fenced page and simulate processing failure while retaining the previous checkpoint. Verify terminal/empty cursors reset the fence and operation/byte budgets never skip or split a record.
- **API-5:** Read the bootstrap snapshot, cursor, and action_tags at one revision. Exercise a write interleaving between bootstrap and incremental reads. Verify receipt/state rollback has no visible feed record and retain CAS, replay, and Undo coherence.
- **API-6:** Reject malformed, noncanonical, wrong-scope, future, and expired cursors explicitly; accept the oldest valid position `P=L-1`; reject malformed deltas and retained revision gaps.
- **API-7:** Compare durable state, revision, and receipt rows before and after successful and failed reads. Verify no action completion or date rewriting, and retain existing proposal and unknown-request recovery behavior.

## Out of scope

This unit does not establish VALUE-1 through VALUE-4 caller/model usefulness, hosted D1, Sites identity provenance, ChatGPT Work retrieval/cache behavior, deployment, external notifications, or server-side consumer checkpoints. Local memory or hand-written SQLite tests are supplemental and cannot replace actual Worker `env.DB` observations.
