---
change: change-20261003-atomic-row-storage
role: requirements
---

# Requirements and acceptance criteria

The user requested retiring whole-database rewrites, persisting related records transactionally/atomically, and removing unused columns. Review the completed Project/Tag work, but do not add new Inbox or Project/Tag state implementation to this change.

- R1: An edit saves only changed rows. Do not delete/reinsert unchanged tasks, catalog entries, relationships or original input.
- R2: Save or roll back the operation receipt and changed task, relationship, catalog and identity-marker rows together in one D1 batch.
- R3: An identical retry with the same operation ID and exact original request uses the existing receipt. Preserve contracts for conflicts, different input, missing responses, later corrections and owner isolation.
- R4: Retire owner_state and derive global revision from operations. Remove unused initial_title, last_request, defer_zone, schema_version, commit_token and persistent time-zone/counter fields.
- R5: Resolve date-only Defer to 09:00 in the request's client time zone, then UTC. Use the client time zone to display dates/weekdays without changing saved instants.
- R6: Preserve existing tasks, captures, catalog, relationships, identity markers and operation receipts through additive migrations. Before deletion, reject a revision rollback caused by missing history. Preserve Undo behavior for old tasks containing retired fields.
- R7: Evaluate Project/Tag structure and Inbox/state gaps, distinguishing current implementation from proposals.

Preserve full reads, schemaVersion 2 expectedRevision and owner authentication isolation. Unrelated writes may conflict on the global revision. New public row-level update contracts, integrating captures into Inbox, retiring manual_wait and adding Project/Tag states are out of scope.
