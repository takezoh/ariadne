---
change: change-20261004-transient-create
role: implementation
---

# Implementation

The closed transient model owns local identity, content eligibility, authoritative-snapshot overlay, dependency closure, pruning and typed reference replacement. Controller state.data remains the authoritative full snapshot. DOM displayData derives the visible overlay and maps raw date/editor state when a receipt supplies a saved UUID.

Content autosave uses the existing owner-wide serial lane, revision, typed receipt and exact unknown recovery. The local draft becomes a saved draft after acknowledgment; only captured matching fields clear, and newer content or unsupported dates/status remain queued. Local movement is explicitly unavailable before content is committed; classification proposals may wait on local catalog dependencies without sending local IDs.

Named public Project/Tag add and edit validation is tightened by the separate native backend owner. Current persisted records require nonempty names and titles; the UI does not synthesize names or repair invalid persisted snapshots. Existing schema/migrations and ownership guarantees are preserved. No new migration or hosted deployment is included.

Native implementation executed directly; no development-loop kernel or Git ingestion result is claimed.

Final additional scope includes tests/ui/autosave.test.mjs and tests/ui/movement-application.test.mjs, whose four creation/recovery cases now provide the transient model and enter valid content before expecting a persistence operation. Runtime source remained frozen during this test-only migration.

## Catalog inspector-close correction

Closing a catalog inspector used selectAction(null) while selectedId was already null, so untouched local catalogs were not pruned. The shared selection boundary now treats closing any open inspector as abandonment. Existing edited, pending and transitive-dependency retention rules are unchanged.

## Selected temporary Add replacement

Explicit Add discards a selected local proposal before creating its replacement, including edited proposals, unless pending/unknown persistence or retained dependent references prevent safe removal. Replacement keeps the persisted parent/classification context and does not create a child of the removed local identity. Obsolete timers/jobs are canceled before any flush. Add-specific IME/blur handling avoids committing the proposal being replaced; navigation and Close retain their separate edited-proposal rules.
