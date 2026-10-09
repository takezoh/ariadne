# Data model and consistency

Updated: 2026-10-09. The current contract is defined by [schema](../../db/schema.ts), [action model](../../lib/domain/core.ts), [application service](../../lib/application/action-service.ts), [migration 0009](../../drizzle/0009_action_model.sql), and [perspective migration 0010](../../drizzle/0010_ambiguous_umar.sql). Completed change packages describe their original versions, not the current API.

## Data and management policy

The model represents shared state used by the human and authorized AI consumers: everyday actions, original notes, containment, classifications, dates and saved perspectives. The API calls the saved entity action. User prompts and caller-side LLMs interpret that state and choose GTD or other management conventions; classification names and descriptive text do not impose a method or become executable policy. Caller-side collection and scheduling write through the same owner-scoped operations as conversation and UI. Ariadne validates data integrity, not an external management routine.

## Durable records

| Table | Key | Content |
| --- | --- | --- |
| actions | owner, id | title, notes, lifecycle status, parent_id, project_id, order, flagged, due_at, defer_until, revision, timestamps |
| projects | owner, id | local name, description, parent_id, sibling order, revision, timestamps |
| tags | owner, id | local name, description, parent_id, revision, timestamps |
| action_tags | owner, action_id, tag_id | many-to-many association and revision |
| catalog_identity_ledger | owner, kind, identity | reserved catalog IDs and latest project/tag/action_tag mutation revision |
| perspectives | owner, id | name, description, filter, definition_version, revision, created_at, updated_at |
| operations | owner, operation_id | canonical request, result, delta, before/after revision, undo_of, timestamp |

There is no tasks, task_tags, or dependencies table in the current schema. Action relationships are parent-child containment only. Independent prerequisite edges and sequential/parallel modes are unsupported. An explicit on-hold action remains an ordinary unfinished action.

## Order and direct flags

`order` is a nonnegative safe integer rank (0 through 9,007,199,254,740,991). Siblings share a parent; roots share a project, with unassigned roots forming their own group. An omitted rank appends after the greatest rank in that scope, starting at zero. Moving an action to a different parent, or moving a root to another project, appends at the destination unless a parent edit explicitly supplies a rank. If the maximum rank is exhausted, supply explicit ranks to renumber before appending.

Ranks may have gaps or duplicates. Equal ranks are ordered by stable action ID. Read results group roots by project ID, order siblings by rank then ID, and emit each parent's descendants immediately after it. Filtering preserves that relative order. Changing a rank does not rewrite neighboring actions or impose completion, visibility, or availability constraints: a later sibling can complete first.

`flagged` is a strict boolean, false for new actions unless supplied explicitly. It is direct state only: neither action parents nor projects supply inherited flags. Flag changes do not change lifecycle status, Due, or Defer. Completion, withdrawal and reopen preserve it. Queries can filter either boolean value across all lifecycle states. The UI Flag scope contains flagged actions whose projected view is normal; deferred flags remain stored and can be retrieved by query.

## Lifecycle and projection

Lifecycle values are `active / on-hold / completed / dropped`. The view is calculated on read, in this priority order:

1. dropped: cancelled;
2. completed: completed;
3. future Defer on the action or an ancestor: deferred;
4. otherwise: normal.

`is_deferred` independently reports future own/ancestor Defer, even for completed or dropped actions. `defer_reasons` identifies the source action, title, UTC instant and whether it is an ancestor. Reading after expiry changes the projection without rewriting stored dates or reopening completed actions. Due is a deadline and never hides an action.

Inbox is all project-unassigned unfinished actions (active/on-hold), including deferred actions. Waiting is explicit on-hold, also including deferred actions. Neither depends on title, an organization flag, or prerequisite state. The response contains no waiting/prerequisites arrays on individual actions.

Setting a parent completed atomically completes all descendants while preserving their other attributes. Completing children never automatically completes a parent. A descendant may later reopen independently. Withdrawal stores dropped rather than deleting the action; associations and containment remain editable.

## Dates and hierarchy

Timestamp inputs require Z or an explicit UTC offset and are normalized to UTC ISO instants. Date-only Defer requires the request's client timezone and resolves that day's 09:00 there. Saved instants do not change when the client timezone changes. Nonexistent or ambiguous wall times require an explicit instant. Timezones are not persisted.

An action has at most one parent and one project, plus multiple tags. Cycles, missing parents and invalid associations are rejected in pure logic; there are no SQL foreign-key constraints for these references. Project and tag hierarchies are separate from action containment and do not inherit lifecycle, dates, membership or flags.

Catalog names are local, trimmed and case-sensitive; derived display paths join ancestor names with `/`. Identity always uses server-generated UUIDs. Get-or-create matches owner, parent and local name. Root/nested natural-key indexes reject nonempty-name duplicates; all sibling names participate in uniqueness. Deleted project/tag IDs remain reserved and can only be restored by an applicable Undo. New action/project/tag IDs cannot be supplied by callers. Structure requests use unique local refs; the first ref edits the existing action and later refs create actions. Parent refs need not precede children in the request.

## Atomic writes, replay and Undo

Owner-wide revision is MAX(operations.revision_after), zero for an empty owner. A read batch retrieves revision, actions, catalog rows, associations and identity markers consistently. Saving derives a delta and writes only changed identities. The receipt INSERT trigger checks the latest owner revision; receipt, action/catalog/association writes, identity markers and history pruning share one atomic D1 batch. A failed statement rolls all of them back. There is no owner_state or full-snapshot replacement.

These deltas and receipts serve atomic persistence, write replay and Undo. Current reads expose snapshots and revision, not a consumer's change-feed position or an acknowledgment of reading or understanding. The [Change Cursor proposal](../design/product.md#change-cursor-proposal) leaves its relationship to revision, change-record representation and retention open; the existing 100-operation receipt window is not a promised change-feed retention contract.

New writes require schemaVersion 2, a UUID operation ID and current expectedRevision. Preview neither saves nor reserves revision or generated IDs. Canonical requests include the tool name and complete original arguments. Replaying the same ID and identical request returns its receipt with the current snapshot; it never rolls back later corrections. Different arguments under the same ID are rejected. Generated IDs are stored under result.resolved.actions/project/tag.

Each owner retains the latest 100 operations, including Undo and no-op writes. Replay, receipt lookup, input-conflict detection and Undo are guaranteed only inside that window. not_observed can mean pruned history and is not proof of a failed save. Preserve an unknown request's exact ID and arguments; do not replace it with a new ID or revision to retry.

Undo compares the current action state and revision with its recorded after-state. Order and flag changes participate in the same comparison and restoration. Unrelated changes are preserved; later changes to the target reject Undo. Catalog identity markers detect delete/restore or detach/reattach ABA and reference changes. Restoring an association to a deleted tag omits that association while restoring other eligible changes. Undo of an addition marks the action dropped rather than physically deleting it. Undo of Undo is unsupported.

## Migration boundary

0000 through 0008 remain immutable migration history. 0009 intentionally resets disposable test data for all owners: actions formerly stored as tasks, dependencies, associations, projects, tags, identity reservations and operation receipts. It creates empty actions/action_tags tables and preserves the existing DB binding and revision guard. Pre-reset IDs, revisions, requests and Undo history do not carry forward. There is no runtime conversion or fallback for the old task/dependency contract.

Deployment must stop old writes, apply 0009 and switch to the new Worker, then reload clients and start fresh operation IDs. Applying the SQL locally or in SQLite tests does not mean the hosted DB has been reset or the Worker deployed.

## Saved perspectives

A perspective is an owner-scoped View storing extraction conditions only. It contains id, name, description, filter, definition_version=1, revision and timestamps; owner is mandatory in SQL and supplied by trusted server context, omitted from owner-scoped domain snapshots. IDs are server-generated and remain reserved after removal. Names need not be unique.

Filters accept statuses (unique lifecycle array), is_deferred, flagged, project_id (UUID/null), tag_id and include_descendants. Conditions combine with AND; status values are alternatives within the array. Omission is unrestricted, {} matches all lifecycle states, and statuses:[] matches none. Explicit project_id:null means unassigned. include_descendants expands classification hierarchies only.

Evaluation projects the current owner snapshot at read time, then filters while preserving action-tree relative order. It does not store action copies, match membership, sort overrides, grouping or display settings. Direct flags do not propagate; unmatched action parents are not inserted as matches. Reads never advance revision or rewrite expired Defer.

Perspective CRUD participates in the same atomic operation/receipt/Undo batch and catalog identity ledger. Filter edits replace the full definition. Project/Tag deletion refuses saved filter references; Undo cannot restore a filter with a missing reference or silently weaken conditions. Migration after 0009 adds storage while preserving existing records and receipts. The shared UI can select saved perspectives and display their exact extraction conditions and descriptions. It evaluates the full read-time snapshot without a hidden lifecycle or Defer filter and preserves action order. Perspective creation/editing/removal remains available through the shared API; hosted rollout requires separate acceptance.

## Catalog descriptions

Projects, tags and perspectives store non-null `description` text, defaulting to empty. It is optional caller-controlled context, preserved exactly and limited to 65,536 UTF-16 code units by pure validation. It does not affect identity, inheritance, membership, lifecycle or perspective predicates. Description edits use ordinary catalog deltas, identity markers, revision, receipts and Undo.

[Migration 0011](../../drizzle/0011_catalog_descriptions.sql) adds these columns without resetting records, revisions, associations or operation history. Receipt bytes are retained, but Undo requires current-schema description fields and rejects incomplete deltas without filling them. This is separate from the retired action-model conversion/reset.

New Action titles and explicit title edits require nonempty trimmed text (maximum 200 UTF-16 code units). Every stored Action must satisfy the current required-title contract; invalid stored records fail validation without automatic correction or deletion. Notes are optional exact raw text and cannot replace the required title on creation. Perspective names and structure reference names remain nonempty; Project/Tag name writes require nonempty trimmed text. Initial `add.tag_ids` are unique owner-scoped tag IDs; their association rows and identity revisions share the action creation CAS batch, receipt and Undo delta. The Action title and initial Tag-association contract requires no schema migration; catalog indexes follow forward migration `0015_required_catalog_names` below.

`action_move` changes only effective selected roots' parent containment and affected destination sibling ranks. Selected descendants of selected ancestors travel with their subtree rather than moving twice. Before/After uses the anchor parent; Into appends children; top-level detach appends separately within each root's unchanged Project group. Root Before/After requires matching direct Project membership. Hidden siblings retain relative order; source-only gaps remain valid. Actual changed rows share the ordinary revision/receipt/delta/Undo batch.

The UI Projects/Tags outline combines catalog hierarchy with direct Action membership. Action containment changes indentation only within the same membership; it never inherits a Project or Tag. Repeated Tag occurrences share one Action UUID, draft, write and Undo identity. Catalog inspectors use separate typed name/description drafts and the existing catalog revision/receipt path.

`action_project` and `action_tag` accept an existing `id` or a nonempty unique `ids` list, exclusively. Every listed Action receives the direct classification change, including selected ancestors and descendants. One operation shares the same owner revision, atomic associations/identity markers, receipt and Undo. Project changes preserve containment and child order; changed roots append to destination Project scope in caller order. Tag addition preserves other direct Tags.

## Project sibling order

Projects have a required nonnegative safe integer `order` independent of Action rank. Siblings compare order, local name and UUID. New Projects append to their parent scope. Direct `project_move` parent changes append; relative before/after/inside/root moves change the parent and normalize only the destination sequence when it changes. Source gaps remain valid. Intact Project descendants, direct Action membership, Action containment, lifecycle, dates, flags and Tags remain unchanged. Tag moves follow the same durable sibling-order contract.

Migration 0013 adds Project order with default zero and an integer range check, preserving existing records, revisions, identity markers and receipt bytes. Ties preserve alphabetical presentation for migrated Projects. Project delta records missing order are rejected; snapshots and Undo require the current complete schema. Destination peers changed by a move share catalog revision/identity markers, so later hidden sibling corrections reject destructive Undo.

## Required catalog names

`project_add` and `tag_add` accept `{name,parent_id?,description?}` without a caller ID. The server always creates a distinct UUID and returns `result.resolved.project` or `result.resolved.tag` as `{id,created:true}`. Names are trimmed strings up to 200 UTF-16 code units, requiring nonempty trimmed text for creation and name edits. All stored names must satisfy the same current nonempty contract. Nonempty names remain case-sensitive and unique under the same parent. `project_get_or_create` and `tag_get_or_create` still require nonempty names and preserve existing descriptions on a match.

Project and Tag creation append within their respective parents using durable order. Creation does not assign Actions. Exact replay returns the receipt’s original generated ID without allocating a duplicate; unknown outcomes retain the same operation ID and arguments. Creation uses the existing owner-wide CAS, atomic catalog/identity/receipt batch and conflict-safe Undo. Forward migration `0015_required_catalog_names` restores four full sibling-name uniqueness indexes without rewriting applied migrations or stored rows. Invalid duplicate data causes migration failure; it is not repaired, renamed or deleted. Current-schema rows and receipts are required for reads, writes and Undo. Missing Project/Tag order, catalog description or collections are rejected instead of synthesized. Ordinary exact replay, CAS and conditional Undo remain unchanged for valid current-schema operations.

## Tag sibling order

Tags require a nonnegative safe-integer `order`, persisted independently of Action associations. New Tags append after the highest rank under the same parent. Equal ranks sort by local name, then UUID. `tag_move` accepts `{id,parent_id:null|uuid}` or `{id,placement:before|after|inside|root,anchor_id?}`; the forms are exclusive. Relative movement normalizes only destination sibling ranks when their sequence changes. Direct same-parent movement and unchanged relative sequences leave rows unchanged. Moves preserve subtrees and Action associations, reject cycles and sibling-name collisions, and share ordinary owner revision, atomic receipt, replay and Undo guarantees across all touched peers. Stored Snapshot and receipt Tag rows require `order`; absent values are rejected without runtime conversion.

Forward migration `0016_tag_order.sql` adds the constrained column with SQL default `0`, retaining all existing rows and receipt bytes. This migration does not rewrite historical receipts. Old receipts lacking required Tag order are invalid under the current schema. Existing migration files remain unchanged.
