---
change: change-20261003-saved-perspectives
role: implementation
---

# Implementation contract

## Responsibilities

Domain owns strict filter normalization/reference validation, pure read-time evaluation, perspective CRUD and delta/preview/Undo. Evaluation filters the existing projection rather than comparing ranks across unrelated sibling groups. An unmatched parent does not become a match merely because a child matches.

Application uses the existing store/clock/ID ports, generates creation IDs, rejects caller-owned identity/owner fields, exposes list_perspectives and query_perspective {id}, and adds perspective_add/edit/remove to apply_change and preview_change. Name duplication is allowed: IDs identify views. Explicit filter edits replace the whole filter.

D1 stores perspectives keyed by (owner,id), adds them to consistent snapshot reads, and writes only changed rows with the existing receipt/CAS/marker/pruning batch. Domain snapshots omit owner like existing action/catalog records; the store supplies authenticated owner for every SQL operation. Catalog identity markers reserve deleted perspective IDs and detect ABA changes. No action row is rewritten for view-only CRUD.

## Public definition

Perspective records contain id, name, filter, definition_version=1, revision, created_at and updated_at. Owner is mandatory in storage and is never a caller-selectable argument. Filters accept statuses (unique lifecycle array), is_deferred and flagged booleans, project_id (UUID/null), tag_id (UUID), and include_descendants (boolean). {} means all actions, including completed and dropped. statuses:[] means none.

Writes use perspective_add {name,filter}, perspective_edit {id,name?,filter?}, and perspective_remove {id}. Creation returns result.resolved.perspective.id; preview IDs are provisional. Read evaluation returns the current definition, revision, actions and retrieved_at.

Reference guards apply both to ordinary Project/Tag deletion and Undo validation. Restoring a view cannot recreate a missing classification node or weaken its filter. Parent/Project/Tag moves may legitimately change the membership of a saved dynamic view on its next read.

## Migration and delivery

Use an additive migration after 0009. Preserve existing data and operation receipts; old receipts without perspective deltas remain valid. No reset or hosted operation is part of this change. UI continues to consume ordinary action snapshots; new perspective controls are not introduced.
