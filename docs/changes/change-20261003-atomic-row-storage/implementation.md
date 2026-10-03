---
change: change-20261003-atomic-row-storage
role: implementation
---
Product and vendor names and identifying source URLs have been removed from this historical reference. The observations below are retained research summaries, not independently verifiable source citations.


# Implementation contract

## Atomic delta persistence

The D1 adapter receives JSON for changed rows from a pure delta, then deletes/upserts by primary key. Do not use owner-wide DELETE/INSERT. Preserve rowid, revision and content for unchanged rows. Compare deltas using Maps.

The first statement in the batch is an operations INSERT. Migration 0005's BEFORE INSERT trigger verifies that the latest MAX(revision_after) equals revision_before and revision_after=revision_before+1. Keep the receipt, delta rows and catalog_identity_ledger change markers in the same batch. If a later statement fails, the receipt also rolls back. The unique index on operations(owner,revision_after) supports revision reads and prevents duplicates.

For a same-ID conflict, reread the receipt: exact original payload returns the existing result; different input returns idempotency_conflict. Translate only the known revision trigger into conflict. Treat other SQL/transport errors as failure/unknown outcome; do not assert that saving failed—recover by lookup or identical retry.

Operation history is the sole source for global revision; retire owner_state. Receipt deletion/compaction is not provided. Use operation revision for new catalog-row revisions; do not rewrite versions of existing rows during migration. Preserve the identity ledger for deleted-ID reservation and ABA detection.

## Dates and unused columns

Remove Task.initial_title, last_request, defer_zone and all of owner_state. Store dates in UTC. Date-only Defer explicitly receives payload.date and payload.timezone; preview returns the resolved until. UI sends the executing device's Intl time zone. Retire the operation kind that stores a time zone; replace settings UI with guidance about display time zone.

Preserve schemaVersion 2, operationId, expectedRevision and status=open/done/cancelled. Identical retries of old requests can still return their historical result because receipt matching runs first, even for a retired kind. For legacy task-delta comparison, ignore initial_title/defer_zone/last_request but continue checking later-change revisions. Reject Undo of retired time-zone settings with invalid_state.

## Migration

Do not change migrations 0000-0004. Migration 0005 compares owner_state.revision with the latest operation revision and stops on mismatch before deleting state/unused columns and creating indexes/triggers. Preserve tasks, captures, catalog, relationships, ledger and receipts. Coordinate migration and new Worker cutover because the old Worker requires owner_state; do not run the old version against the dropped schema. This change does not deploy.

## Project/Tag and Inbox assessment

Implemented behavior includes stable UUIDs, hierarchical names/derived paths, natural-key Get-or-Create, one project per task, many-to-many tag assignment, filtered queries, rejecting deletion with references, and Undo/ABA protection. Projects are hierarchical catalogs; they do not yet implement reference-product project states or sequential/parallel/single-action types, and Tags do not have an On Hold state. Task parent-child links and project hierarchy are independent, with no same-Project constraint on task parents.

A minimal Inbox could project tasks where project_id=null without a new status or original-input table. It would not reproduce the reference product's configurable cleanup or moving items to Miscellaneous. Integrating captures into Inbox tasks needs explicit migration contracts for existing pending/applied captures, structure_create semantics, saved original text, and retries/Undo for old receipts; do not silently change these here.

Incomplete lists exclude done/cancelled. Do not add Inbox, active-work or waiting as lifecycle statuses. Current status semantics correspond to the reference product's Active/Completed/Dropped states. Do not treat completing the Project/Tag implementation in this change as completing all features of the reference product.

References: the reference product Perspectives (source URL removed), Glossary (source URL removed), [D1 batch atomicity](https://developers.cloudflare.com/d1/worker-api/d1-database/#batch).
