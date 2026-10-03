---
change: change-20261003-saved-perspectives
role: requirements
---

# Requirements

- PR-P01: When an authenticated owner creates a perspective, Ariadne shall generate its stable UUID and persist its name, filter, definition version, revision and timestamps under that owner. Requests shall not supply owner or a new entity ID.
- PR-P02: When a perspective is read, Ariadne shall evaluate its conditions against the owner's current snapshot and read time, preserving existing action-tree relative order and leaving persisted actions/revision unchanged.
- PR-P03: When a filter is supplied, Ariadne shall accept only statuses, is_deferred, flagged, project_id, tag_id and include_descendants. Top-level conditions combine with AND; statuses use set membership. Omitted conditions impose no restriction; an empty status array matches nothing. Unknown keys, duplicate statuses and invalid types/references shall be rejected.
- PR-P04: When filter is edited, Ariadne shall replace the complete filter, retaining unspecified perspective attributes. No order, grouping, display override or materialized action membership shall be stored.
- PR-P05: When a perspective is created, edited, removed or undone, Ariadne shall use the existing schemaVersion 2, owner-wide revision, receipt, exact-request replay, atomic delta and conflict-aware Undo contracts. Deleted perspective IDs remain reserved.
- PR-P06: When deleting a Project/Tag referenced by a saved filter, Ariadne shall refuse without changing any state. Undo shall not restore a filter with a missing reference or silently remove the reference and widen the view.
- PR-P07: Migration shall add perspective storage without deleting or rewriting existing actions, catalogs, reservations or receipts.

Project null explicitly means unassigned; omission means unrestricted. include_descendants expands Project/Tag classification nodes only and never implies action containment, membership or Flag inheritance. On-hold and Defer remain independent. The normal Flag view is statuses active/on-hold, is_deferred false and flagged true.

Acceptance covers domain, application, real adapter statements on SQLite, owner separation and shared API declarations. Hosted D1/auth/ChatGPT acceptance is outside local implementation evidence.
