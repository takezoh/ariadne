# Capabilities and contract discovery

## Responsibility boundary

The service persists structured actions, validates input and ownership, performs deterministic state transitions and supplies a shared UI. Meaning, classification, prioritization and management method belong to the user and caller-side LLM. External-source collection, observation, calendar sync, scheduling and notifications require the caller's own authorized capabilities.

The current delivery environment is ChatGPT with Sites-managed authentication. A skill installed in another assistant does not establish a supported authenticated connection there. Never accept owner identity from operation arguments or invent authentication headers.

## Discover exact operations

Use the host's tool discovery. With a direct MCP client, initialize the configured connection and request `tools/list`; `result.tools` contains tool names, descriptions and `inputSchema`. Read the actual deployment before execution. Discovery may be public while business reads and writes require authenticated ownership.

The current source advertises input schemas but no output schemas. The typed change tools publish a conditional Defer payload schema: use `date` plus `timezone`, or an offset-bearing `until`, never both. Other kinds retain generic payload objects. Their descriptions and the service API reference supply kind-specific fields and result shapes; do not treat that object schema as permission for arbitrary properties. Runtime validation additionally checks valid calendar dates, timezones and the other kind-specific payloads. An older installed reference may differ from the running deployment.

## Capability map

| Goal | Current tools or change kinds |
| --- | --- |
| Inspect the shared UI | `open_actions` |
| Read the complete snapshot and owner-wide revision | `list_actions`, `get_relevant_context` |
| Retrieve a filtered set | `query_actions` |
| Read and evaluate saved views | `list_perspectives`, `query_perspective` |
| Preserve original input | `capture_intent` with a caller-supplied title and exact text |
| Inspect effects without saving | `preview_change` |
| Persist a state change | `apply_change` with a supported kind and payload |
| Check an uncertain write | `operation_status` |
| Request conflict-aware Undo | `undo_change` |
| Add or rename a simple action | `add_action`, `rename_action` |

`apply_change` supports action creation/structuring/editing, status and Defer changes, project/tag catalogs and associations, and filter-only perspective definitions. Obtain exact fields from the current contract instead of inferring them from this map. New entity IDs come from the server. `open_verification` is an acceptance fixture rather than an ordinary task-management workflow.

## State distinctions that affect advice

- An action's lifecycle is `active`, `on-hold`, `completed` or `dropped`. On-hold remains unfinished. Dropped means withdrawn, with the record retained.
- Inbox contains project-unassigned unfinished actions, including deferred ones. Normal view contains unfinished actions without a future own or ancestor Defer. A filtered recommendation is not the complete normal list.
- Due is a deadline; Defer temporarily changes visibility. A date-only Defer requires an explicit client timezone and resolves 09:00 there to a saved UTC instant. Expiry appears on the next read; it does not launch an agent or notification.
- Parent Defer affects descendant visibility without overwriting their dates. Completing a parent completes descendants atomically; completing children never completes the parent automatically. Descendants can later reopen independently.
- Action relations are parent-child containment only. Sibling order expresses intended sequence without restricting execution. Flags are direct booleans without inheritance.
- Projects and tags have separate classification hierarchies. Their names and display paths are not record identity. Notes and descriptions preserve user text and are not executable policy.
- Saved perspectives define filters only; they do not copy actions, reorder them or store a recommendation method. Dedicated perspective UI controls are outside the current contract.
- Planned-work dates, duration estimates, prerequisite edges and sequential/parallel execution modes are not supported fields.

## Write guarantees and limits

New writes require schemaVersion 2, an operation UUID and the latest owner-wide revision. Preview does not reserve state. Identical retained requests replay their receipt without rolling back later corrections; changed input under the same ID is rejected. Undo may refuse later changes to its target.

Only the latest 100 operations per owner are retained. A missing response is an unknown outcome. Keep exact name, ID and arguments for lookup or identical replay; `not_observed` can mean pruned history. Do not turn an unknown request into a fresh write by changing its ID or revision. An explicit revision rejection can be reconciled against current state before a genuinely new request.
