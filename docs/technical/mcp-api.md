# MCP and HTTP API contract

Updated: 2026-10-03. Sources: [MCP route](../../app/mcp/route.ts), [HTTP route](../../app/api/actions/route.ts), [action service](../../lib/application/action-service.ts).

## Caller composition and guidance

Ariadne exposes task-data operations. User prompts, caller-side LLMs, dot and schedulers decide their use; an authorized caller may combine external-source tools such as Slack/email reads with Ariadne writes. No source-specific connector or agent integration is required in Ariadne. The current plugin is delivered in ChatGPT; this does not make one assistant or GTD routine part of the data contract.

Initialize instructions and snapshot assistance_policy provide caller-facing guidance from [assistance source](../../lib/domain/assistance.ts); they do not execute an agent or add semantic backend validation. The repository [Skill](../../skills/action-tools/SKILL.md) is tool-use documentation, not proof of host installation. This documentation update does not modify delivered runtime text. All callers must preserve authenticated ownership and the revision/replay/Undo contract below.

## Entry points and ownership

POST /mcp uses JSON-RPC 2.0 with initialize, ping, tools/list, tools/call, resources/list, resources/read, resources/templates/list and notifications. GET returns 405. Supported MCP protocol values are 2025-03-26, 2025-06-18 and 2025-11-25; other requests negotiate 2025-11-25. Persistent sessions and SSE are not implemented.

POST /api/actions accepts application/json with `{name, arguments}` and invokes the same service for Web preview. When Origin is present it must match the request URL's origin. The old /api/tasks route is absent.

Business reads and writes obtain owner from trusted Sites authentication headers. Arguments cannot select owner. SQL and receipts are owner-scoped. Public initialization and UI resource metadata do not authorize business-data access.

## Tool and schema discovery

Use the connected host's tool discovery, or a direct MCP client's `initialize` followed by `tools/list` against `POST /mcp`. The response contains `result.tools`, including each tool's name, description, `inputSchema`, annotations and any UI metadata. The definitions are served by [definitions](../../app/mcp/route.ts) from the running deployment; this checkout may describe a different source version.

For example, send this read-only JSON-RPC request through the configured MCP transport after initialization:

```json
{"jsonrpc":"2.0","id":2,"method":"tools/list","params":{}}
```

Input schemas reject unknown top-level keys. `apply_change` and `preview_change` publish a conditional payload schema for `kind=defer`: either `date` plus `timezone`, or an offset-bearing `until` (null clears Defer). Other kinds retain a generic payload object and require the fields below. Read the tool descriptions and [change payloads](#change-payloads) together. No `outputSchema` is currently advertised; [responses and recovery](#responses-and-recovery) describe response shapes, including `structuredContent` and domain errors. [Application validation](../../lib/application/action-service.ts) and [domain transitions](../../lib/domain/core.ts) enforce the actual contract.

Discovery does not grant business-data access. The current delivery uses trusted Sites authentication; arbitrary caller-supplied owner or identity headers are not an authentication method. `POST /api/actions` is the Web relay and does not implement MCP discovery. This repository does not publish a separate downloadable JSON Schema or OpenAPI endpoint.

See the [caller workflow guide](../usage/agent-workflows.md) for connection boundaries, optional skills and composition examples.

## Tools

| Tool | Arguments / result |
| --- | --- |
| open_actions / open_verification | Empty arguments; current snapshot with the associated normal/acceptance UI resource |
| list_actions / get_relevant_context | Empty arguments; complete owner snapshot and revision |
| query_actions | Optional status, is_deferred, flagged, project_id (UUID or null), tag_id, include_descendants; AND filtering, no filters returns all actions |
| list_perspectives | Empty arguments; saved owner definitions, revision and retrieved_at |
| query_perspective | id; current definition, matching actions, revision and retrieved_at |
| capture_intent | Write envelope plus title, text, optional source; preserves exact text in an ordinary Inbox action's notes |
| preview_change | expectedRevision, kind, payload; projected effects, warnings and provisional IDs without saving |
| apply_change | Write envelope plus kind and payload; atomic result and current snapshot |
| operation_status | operationId; applied/not_observed and saved result |
| undo_change | Write envelope plus undoOf; safe inverse against current state |
| add_action | schemaVersion, request_id, expected_revision, title |
| rename_action | schemaVersion, request_id, expected_revision, id, title |

The write envelope is `{schemaVersion:2, operationId:UUID, expectedRevision:nonnegative integer}`. The two convenience tools use snake_case request_id/expected_revision. Old task-named tools are absent, not aliases. Unknown argument keys are rejected.

## Change payloads

| Kind | Payload |
| --- | --- |
| add | title, optional parent_id, project_id, tag_ids, notes, order, flagged; no caller-supplied ID |
| structure_create | inbox_action_id, actions: [{ref,title,parent_ref? or parent_id?,notes?,order?,flagged?}] |
| edit | id, optional title, notes, parent_id, due_at, defer_until, status, order, flagged |
| status | id, status: active/on-hold/completed/dropped |
| defer | id with until, or date plus explicit client timezone; do not supply date and until together |
| release / complete / cancel | id |
| reopen | id, optional explicit reopen_ancestors IDs; defaults to reopening only the target |
| project_add / tag_add | nonempty name, optional parent_id, description; no caller-supplied ID |
| project_get_or_create / tag_get_or_create | nonempty name, optional parent_id, description |
| project_edit / tag_edit | id, optional name/description; at least one attribute |
| project_move | id with parent_id (null detaches), or placement:before/after/inside/root plus anchor_id except root; direct and relative forms are exclusive |
| tag_move | id; parent_id (null detaches) XOR relative placement before/after/inside/root with anchor_id except root; durable sibling order |
| project_remove / tag_remove | id |
| perspective_add | name, filter, optional description; no caller-supplied ID |
| perspective_edit | id, optional name/filter/description; at least one attribute; filter replaces the entire definition |
| perspective_remove | id |
| action_project | exactly one of id or ids:nonempty unique UUID array; project_id (required, null clears) |
| action_tag | exactly one of id or ids:nonempty unique UUID array; tag_id, enabled:boolean |

Structure's first ref reuses any existing action identified by inbox_action_id; omitted notes retain its text. Later refs create actions. Refs must be unique, may reference later parents, and are exclusive with saved parent_id. The retired dependencies payload is rejected. There are no independent prerequisite operations or execution modes.

Order is a nonnegative safe integer sibling rank. Defaults append in the parent scope, or project/Inbox root scope. Ties use stable IDs. Order does not gate completion or display. Flagged is a strict boolean with default false; no inheritance. See [data model](data-model.md) for move and filtering rules.

Parent completion cascades atomically, but does not prevent independently reopening a descendant later. Dropped actions remain editable. Release removes only the target's Defer; ancestor Defer remains. On-hold is an explicit lifecycle state, independent of Defer.

Project/tag names are local, trimmed and case-sensitive within an owner and parent; paths are display values, never identities. Get-or-create returns existing or newly generated UUIDs with created. Catalog deletion refuses while children, action references or saved perspective filter references remain. IDs stay reserved after deletion, with restoration permitted only by applicable Undo.

## Responses and recovery

Full snapshots contain schemaVersion, revision, actions, perspectives, projects, tags, result, retrieved_at, storage, proof_stage, assistance_policy and list_scopes. Actions contain saved order and flagged plus view, is_deferred, defer_reasons, project_path and tags. Individual actions do not contain waiting or prerequisites. Results follow tree/sibling order. Scope keys are inbox, waiting, flagged, normal, deferred, completed and cancelled. Flagged scope includes direct flags in the normal view; query_actions can retrieve flags in any lifecycle/view.

Write results identify operationId, its revision, changedIds and optional resolved.actions/project/tag/perspective. Replay returns the saved result alongside a freshly read snapshot; their revisions may differ. A read result is null. Query results contain query, projects, tags, actions and retrieved_at.

Preview contains expectedRevision, kind, payload, affected, affected_projects, affected_tags, affected_perspectives, warnings, evaluatedAt and optional resolved. New candidates marked preview_only are not saved IDs: commit original refs/payload, not candidate UUIDs. Date-only Defer preview resolves 09:00 in the explicit timezone to UTC; commit the resolved until if using the reviewed preview. Preview does not reserve revision.

MCP tools return both JSON text content and structuredContent. Tool-domain failures use isError and structuredContent.error.code/message. HTTP failures use JSON error/message and an error status. Unexpected write-response loss is outcome_unknown, not definite failure.

On conflict keep the proposal and reread before reviewing a new write. On outcome_unknown preserve the exact tool name, operation ID and complete arguments, then query operation_status or resend identically. Reusing an ID with changed revision or payload gives idempotency_conflict. Undo refuses later target changes with undo_conflict.

Only the latest 100 operations per owner are retained. Missing Undo returns not_found; not_observed may mean pruned history. Neither is proof that an unknown write was never committed. Never change an unknown request to a new ID/revision merely to retry.

## UI and migration boundary

Normal UI is ui://action-tools/actions-v4.html; acceptance fixture is ui://action-tools/actions-verification-v4.html, both text/html;profile=mcp-app. They initialize the host before tools/call and retain dirty proposals on refresh or notifications. The fixture can discard one client write response while the real write runs, exercising the normal timeout and exact-request recovery.

Migration 0009 resets the authorized disposable test data and prior receipts. Old task names, payloads and history have no compatibility path. Reload clients after migration and deployment. Local mock-host tests do not validate hosted resource caches or ChatGPT Work behavior.

## Perspective conditions

Saved perspectives are owner-scoped views. filter accepts optional statuses (unique array of active/on-hold/completed/dropped), is_deferred:boolean, flagged:boolean, project_id:UUID|null, tag_id:UUID and include_descendants:boolean. Conditions combine with AND, with set membership within statuses. {} matches all actions; statuses:[] matches none. Project null means unassigned; omission is unrestricted. Classification descendant expansion never implies action containment or Flag inheritance.

query_perspective preserves current action-tree order and does not change actions or owner revision. It evaluates Defer at retrieved_at. perspective_add/edit/remove use ordinary write/preview/replay/Undo envelopes; generated perspective IDs are returned in result.resolved.perspective. affected_perspectives contains before/after delta entries, including null for creation/deletion. Perspective preview candidates marked preview_only are provisional. Definitions do not support order overrides, grouping or display settings. The shared UI provides saved perspective selection and a condition summary. It filters the full authoritative read-time snapshot without an additional lifecycle or Defer restriction. Perspective creation/editing/removal remains available through these API operations.

## Descriptive context

Projects, tags and perspectives expose `description` as exact caller-controlled free text. Creation defaults to empty text. The maximum is 65,536 UTF-16 code units, matching action notes; null and non-string values are rejected. Whitespace and line breaks are preserved. On edit, omission retains the saved value and an explicit empty string clears it. Description-only edits are supported and participate in preview, owner revision, atomic persistence, receipts, replay and Undo.

Project/tag get-or-create accepts an initial description but never overwrites an existing match, even when a different description is supplied; use an explicit edit to change it. Supplied descriptions are validated even for existing matches. Description does not affect names, uniqueness, hierarchy, associations, action states or filtering. A perspective's filter remains authoritative for deterministic extraction. Text is context for humans/LLMs, never authorization or executable policy.

Full snapshots and query_actions expose descriptions in projects/tags; full snapshots and list_perspectives/query_perspective expose them in perspective definitions. The HTTP and MCP entries share these operations and results. The shared UI displays descriptions for the selected Project, Tag or Perspective. Project/Tag Name and Description inspectors autosave through project_edit/tag_edit, while inline creation uses existing get-or-create and server-generated IDs. Perspective editing remains available through the shared API. Apply additive migration 0011 before running the new Worker.

Action creation and explicit title edits require nonempty trimmed text with a maximum of 200 UTF-16 code units. Notes are optional and preserved exactly. Perspective names, structure references and `capture_intent` titles remain nonempty; Project/Tag name writes require nonempty trimmed text. Stored rows and receipts must match the current schema. Missing fields and blank required names fail validation without default values or compatibility conversion. `apply_change` with `kind: add` can supply title, notes, project and unique initial `tag_ids` in one request. All referenced tags must belong to the owner. Initial action/tag associations participate in the same revision, receipt and Undo batch.

The shared UI Add button starts a local temporary proposal in every view, using an appropriate selected tree object or a root fallback. Starting, rendering or dismissing an untouched proposal does not write to storage. An Action commits only after a nonwhitespace Title is supplied; Notes are optional exact raw text. Header Project/Tag Add opens the corresponding tree with a temporary proposal and commits only after a valid nonempty name. The existing `add`, `project_add` and `tag_add` operations create server UUIDs on commit. Unknown creation results retain the exact request; the created ID comes only from the confirmed receipt.

The shared UI uses `preview_change` internally for validation and resolved dates, followed immediately by the ordinary `apply_change` operation. Editor changes autosave after a short debounce or blur; routine Save/Review controls are absent. This does not change the MCP API: caller-side clients may continue to use explicit preview/apply. Unknown UI writes retain exact request identity; overlapping external field corrections require inline reconciliation.

`apply_change` also accepts `kind: action_move` with `{ids, placement, anchor_id?}`. `ids` is a nonempty unique owner-Action UUID array; selected descendants of selected ancestors are absorbed, and remaining roots preserve supplied relative order. `placement` is `before`, `after`, `inside` or `root`. An anchor is required for the first three and forbidden for `root`. One operation changes parent/order only: Before/After inserts under the anchor parent, Into appends after all children, and root appends within each unchanged direct Project group. Cross-Project root Before/After and cyclic/self destinations reject atomically. The existing request byte limit applies; there is no new arbitrary ID-count cap. Full hidden sibling structure, exact replay and one conditional Undo are retained.

The shared UI provides four named status icons above Title, existing Project assignment and independent tag toggles, orange active Flag, and pointer/touch/keyboard list movement. Parent/Order text inputs are absent. Shift range selection uses visible rows; UI bundle IDs use canonical full-tree order. The compact Move chooser is a direct movement control, not a Review/Save workflow.

Batch `action_project` and `action_tag` classify every supplied Action, including selected ancestors and descendants, in one owner revision, receipt and Undo. UUIDs are owner-scoped and input order is authoritative. Newly assigned Project roots append in that order; containment, child order, lifecycle, dates, flags and other Tag associations remain unchanged. Unknown outcomes retain the exact operation ID and arguments. No new operation or migration is required.

For atomic classification of multiple Actions, `action_project` accepts `{ids,project_id}` and `action_tag` accepts `{ids,tag_id,enabled}` as alternatives to their existing single `id` payloads. `id` and `ids` are exclusive; `ids` is nonempty, unique and owner-scoped. Selected ancestors do not absorb selected children for classification. The header Add split menu consolidates local temporary Action and catalog proposals, and Action inspectors use searchable Project/Tag pickers with inline get-or-create. Dragging onto a catalog header changes classification; dragging onto an Action changes containment/order. Unknown outcomes retain exactly one frozen request.

Projects expose durable sibling `order`. `project_move` relative placements use full owner-scoped siblings, normalize only changed destination sequences, and retain source gaps. Equal ranks compare local name then UUID. Direct parent changes append; same-parent requests retain row rank/revision. Parent/subtree integrity, catalog natural-key uniqueness, peer identity markers, atomic CAS, receipt replay and Undo apply to both forms.

## Direct named catalog creation

`project_add` and `tag_add` accept `{name,parent_id?,description?}` without a caller ID. The server always creates a distinct UUID and returns `result.resolved.project` or `result.resolved.tag` as `{id,created:true}`. Names are trimmed strings up to 200 UTF-16 code units, requiring nonempty trimmed text for creation and name edits. All stored names must satisfy the same current nonempty contract. Nonempty names remain case-sensitive and unique under the same parent. `project_get_or_create` and `tag_get_or_create` still require nonempty names and preserve existing descriptions on a match.

Project and Tag creation append within their respective parents using durable order. Creation does not assign Actions. Exact replay returns the receipt’s original generated ID without allocating a duplicate; unknown outcomes retain the same operation ID and arguments. Creation uses the existing owner-wide CAS, atomic catalog/identity/receipt batch and conflict-safe Undo. Forward migration `0015_required_catalog_names` restores four full sibling-name uniqueness indexes without rewriting applied migrations or stored rows. Invalid duplicate data causes migration failure; it is not repaired, renamed or deleted. Current-schema rows and receipts are required for reads, writes and Undo. Missing Project/Tag order, catalog description or collections are rejected instead of synthesized. Ordinary exact replay, CAS and conditional Undo remain unchanged for valid current-schema operations.

## Tag sibling order

Tags require a nonnegative safe-integer `order`, persisted independently of Action associations. New Tags append after the highest rank under the same parent. Equal ranks sort by local name, then UUID. `tag_move` accepts `{id,parent_id:null|uuid}` or `{id,placement:before|after|inside|root,anchor_id?}`; the forms are exclusive. Relative movement normalizes only destination sibling ranks when their sequence changes. Direct same-parent movement and unchanged relative sequences leave rows unchanged. Moves preserve subtrees and Action associations, reject cycles and sibling-name collisions, and share ordinary owner revision, atomic receipt, replay and Undo guarantees across all touched peers. Stored Snapshot and receipt Tag rows require `order`; absent values are rejected without runtime conversion.

Forward migration `0016_tag_order.sql` adds the constrained column with SQL default `0`, retaining all existing rows and receipt bytes. This migration does not rewrite historical receipts. Old receipts lacking required Tag order are invalid under the current schema. Existing migration files remain unchanged.
