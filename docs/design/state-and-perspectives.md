---
id: design-state-and-perspectives
kind: design
title: Ariadne State, Parameters and Perspectives
status: superseded
created: '2026-10-02'
updated: '2026-10-03'
summary: Distinguish the meanings stored in D1, deterministic display conditions and dot's recommendations; separate the current MVP from extension ideas informed by the reference product.
tags:
- product
- state
- perspectives
- state-and-view-design
owners: []
relations:
- {type: partOf, target: design-product}
- {type: references, target: design-assistance}
- {type: references, target: note-20261002-state-and-view-design-research}
source_paths: []
scope_type: area
responsibilities:
- id: RESP-001
  statement: Set design criteria that keep the meanings dot handles distinct across persistent state, display conditions and recommendations.
invariants:
- id: INV-001
  statement: Conversation and UI use the same D1 source of truth; do not duplicate tasks per perspective.
  enforcement: contract
- id: INV-002
  statement: Keep parent-child, dependency, waiting, Defer and deadline as distinct meanings.
  enforcement: contract
- id: INV-003
  statement: Do not replace regular-list conditions with dot's recommendations or a future actionable view.
  enforcement: review
boundaries:
  provides:
  - Separation between state meaning and display
  - Mapping of current parameters and extension candidates
  consumes:
  - Settled MVP contract
  - D1 schema
  - the reference product references
  forbidden:
  - Sending unimplemented attributes to the current API
  - Conveniently treating unknown values as known values
variability:
  fixed:
  - Current C1-C4
  - Meaning of saved dates
  - Deterministic regular/deferred/completed projections
  free:
  - Whether to adopt additional attributes
  - Representation of saved views
  - Format of recommendations and explanations
capabilities: []
failure_responsibilities:
- Preserve the user's correction when interpretation is wrong; explain when a meaning cannot be saved as unsupported.
trust_boundaries:
- Do not confuse a model's selection with the complete source of truth or the complete snapshot needed for validation.
compatibility_policies:
- Introduce extension candidates through a separate change design without modifying the schemaVersion 2 API contract.
---

# Ariadne State, Parameters and Perspectives

> Superseded historical design. References to dot, dependencies, candidate perspectives and unsupported observation describe the recorded version, not restrictions on current caller workflows. Current Ariadne exposes data tools to user-defined LLM management; external collection and scheduling belong to the caller. See [current state design](design-action-state-and-perspectives.md), [product design](product.md) and [caller responsibilities](assistance.md).

## 1. Separate three responsibilities

**Saved facts and intent, condition-based views, and context-based recommendations** are separate concerns.

| Concern | Example | Owner |
| --- | --- | --- |
| Source-of-truth state | Original input, corrected title, parent-child links, dependencies, Defer date | D1 and Ariadne change contract |
| Deterministic projection/filter | Regular, deferred and completed lists; waiting reasons; matching explicit conditions | Ariadne reads and verifiable conditions |
| Contextual assistance | What to advance now, whether to ask a question, whether to suggest Defer | dot following prompts |

Even a thin interface must read state under requested conditions and make consistent changes. Do not hide assistance policy—such as “what matters”—inside a projection.

## 2. Current persistent model

This describes the current repository implementation, not proof of what is deployed. See [implementation](../changes/change-20261001-structured-todo-mvp/implementation.md) for exact operations and the [active feature change](../changes/change-20261003-projects-and-tags/requirements.md) for project/tag update contracts.

| Stored item | Main current fields | Meaning |
| --- | --- | --- |
| tasks | title, notes, status | Name and notes including original wording; active/waiting/done/cancelled in this historical model |
| Parent-child | `tasks.parent_id` | What an item is part of |
| dependencies | dependent, prerequisite | What another item depends on; separate from parent-child |
| Dates | `due_at`, `defer_until` | Deadline versus when a task can return to the regular list |
| Waiting | `status=waiting`, dependency reasons | Waiting versus Defer |
| projects / tags | owner, stable UUID, local name, `parent_id` | Separate hierarchies and derived paths; no forced GTD project meaning |
| task_tags | `task_id`, `tag_id` | Association between a task and multiple tags |
| identity ledger | Latest change revision per identity | Evidence for ID reservations after deletion and Undo conflicts |
| operations | operation_id, request, result, delta, before/after revisions, undo_of | Evidence for global revision, retries, result lookups and Undo |

The server-side authentication boundary determines the owner; users cannot choose an arbitrary owner or SQL. Conversation/UI display state and unsaved drafts are not the source of truth.

The current model stores hierarchical general-purpose projects/tags and their task associations. It has no independent attributes for GTD-specific outcome-defining project types, estimated duration, Planned, saved perspectives or review records. Do not present these as available or send unknown fields to the API.

## 3. Keep meanings distinct

### Original input, organized result and commitment

Distinguish successfully saving input from understanding it well enough to create tasks. A reference URL or interest is not necessarily a commitment to act. Do not turn undecided input into planned work merely to fit it into the schema.

Preserving explicit information, the source of inferences and user corrections is an assistance requirement. It does not mean adding a dedicated field for every distinction immediately. Decide from concrete scenarios whether original input, notes and history are sufficient or whether ongoing reuse benefits from structured data.

### Parent-child, dependency and project

Parent-child means containment; a dependency is a prerequisite for execution. Do not infer dependencies from list order or execution order from parent-child links alone.

“An outcome to achieve” is a useful concept for GTD projects, but do not constrain the current project node to that type. Do not force a one-off action to become a project. Resolve projects/tags by owner, parent and trimmed case-sensitive local name; reject duplicate names under the same parent. Ariadne generates new entity UUIDs, separate from operationId.

### Waiting, future candidates and Defer

| Concept | Meaning | Caution |
| --- | --- | --- |
| Waiting | Waiting on a dependency, another person or an event | Passage of time alone does not confirm an external fact |
| Future candidate | An interest not currently accepted as work | Do not apply the same pressure as an incomplete task; a dedicated attribute is only a future idea |
| Defer | Intent to remove an item from the regular list until a point in time | Not completion, deletion or a deadline change |

The broad meaning of Defer in the GTD workflow is not the same as Ariadne's date-specific Defer. See G4 in the [GTD research note](../note/note-20261002-gtd-benefits-and-llm-research.md).

### Defer, Planned and Due

| Concept | Intent to preserve | Current mapping |
| --- | --- | --- |
| Defer | “Do not show this until Friday” | `defer_until`, etc. |
| Planned | “I would like to work on this Friday” | Candidate for an independent attribute |
| Due | “This is required by Friday” | `due_at` |

Do not turn “I want to do this next week” into a deadline. Do not misrepresent unsupported Planned as Due; explain what can actually be done, such as retaining the original wording in notes. If Due conflicts with Defer, show the effect. dot must not silently extend the deadline or clear Defer.

## 4. Preserve the MVP contracts

Preserve the meaning of C1-C4 in the [accepted requirements](../changes/change-20261001-structured-todo-mvp/requirements.md). C3's time zone was changed from persistent settings to the request's client zone in the [atomic-row persistence change](../changes/change-20261003-atomic-row-storage/requirements.md). Consulting the reference product is not grounds to change these contracts automatically.

| Contract | Meaning |
| --- | --- |
| C1: parent Defer | Hide descendants from the regular list too. Preserve each child's date and show scope/deadline risks before acting. |
| C2: parent completion | Completing a parent atomically completes all descendants. Completing every child does not auto-complete the parent. |
| C3: date-only Defer | Resolve 09:00 in the client time zone explicitly supplied by the request to UTC. Preserve the saved return instant if display region changes. |
| C4: dependency waiting | Without Defer, keep it in the regular list with a wait reason. Resolving a dependency does not clear a manual Defer. |

Calculate regular/deferred changes at list-read time from saved state and server time. Do not let an LLM decide on every read whether to release a task, or use a scheduler to rewrite state. Do not reopen a completed item when time arrives.

## 5. Perspective design principles

A perspective is a way to show a task list suited to a purpose or situation so the user can focus on what to do now. It is a view of the same source of truth. Changing its scope does not change Defer/completion/drop state for excluded tasks; adding a task to “Today” does not move it from its original place or create a copy.

If saved perspectives are added, distinguish at least filter conditions, ordering/grouping and presentation. Do not mix dot's recommendation text or current top candidates into permanent source-of-truth state.

| View | Scope | Status |
| --- | --- | --- |
| Regular | Incomplete items not deferred; show dependency waits with reasons | Current MVP |
| Deferred | Items hidden by the user's or an ancestor's Defer | Current MVP |
| Completed | Completed items | Current MVP |
| Actionable now | Regular items that are in scope and have no unresolved prerequisites | Candidate; does not replace the regular list |
| Inbox / to organize | Saved input with unresolved meaning/handling | Incomplete tasks without a Project; no organization-only status |
| Review | Continued commitments, stale waits, missing next actions, etc. | Candidate; distinguish filterable facts from dot's semantic judgment |
| Today / outlook | Show deadlines, planned work, Defer returns and other dates by meaning | Candidate; do not collapse all into “due today” |

The UI does not need to present all views as equally prominent entry points. Internally representable views and entry points that users must consider in daily work are separate decisions.

### Candidate: translate natural language into conditions

If relevant attributes have been added, dot could convert “at home, about 15 minutes, needed this week” into verifiable conditions. Do not claim that freely selecting a few items each time returned every matching item.

Unknown duration is not zero minutes. Distinguish candidates that include unknown values from those with estimates. Interpret “needed this week” as Due only when supported by state and context; clarify only ambiguities that change its meaning.

Save conditions if there is ongoing value. Do not create a new perspective for every temporary question and grow the user's management burden.

## 6. Candidate parameter extensions

These are meanings to evaluate in Ariadne based on GTD and state/view design references, not physical DB schema or settled APIs.

| Candidate | Scenario to validate need | Constraint |
| --- | --- | --- |
| Outcome / commitment | Reuse and distinguish undecided input, future candidates and commitments | Do not create unnecessary projects or commitments |
| Planned | Save a preferred work date separately from the actual deadline | Do not substitute Due or Defer |
| Context tags (place, tool, person) | Repeatedly find candidates suited to context | Avoid excessive required input |
| Duration / energy | Filter candidates for limited time or condition | Allow unknown; do not overstate estimate accuracy |
| Waiting person/condition/check date | A wait reason alone is insufficient for follow-up | Separate planned time from actual arrival confirmation |
| Review record | Distinguish AI inspection from the user's own reconsideration | Reading by AI does not mean user reviewed |
| Inference rationale / correction history | Reuse to avoid repeating the same misunderstanding | Original input and user correction take precedence |
| Recurrence | Distinguish fixed interval from completion criterion | Outside MVP; design new occurrences separately from past completion history |

Do not ask the user to fill a value just because it is missing. Define the scenario first and test whether current state can express it and whether structured data benefits outweigh the burden.

## 7. Continuous state example

Hypothetical input on 2026-10-02: “I ordered a chair part. Assemble it when it arrives. Keep it off my list until next Monday.” Assume the user confirmed Asia/Tokyo as the configured time zone.

Treat the assembly action, arrival prerequisite and Defer until Monday independently. Do not add an unstated deadline. For date-only Defer, show **2026-10-05 09:00 Asia/Tokyo = 2026-10-05 00:00 UTC** before saving, as required by C3.

If the user reports arrival on Saturday, resolving the wait is separate from Defer until Monday; do not clear Defer automatically. If the list is read after Monday and arrival is still unconfirmed, show the task in the regular list with its waiting reason, but it still does not qualify for a future “actionable now” condition. The date alone does not prove arrival. If already completed, do not reopen it when time arrives.

Current waiting may use `status=waiting` or an appropriate prerequisite task; do not assume an unimplemented field for external events. This example does not guarantee an automatic notification at that time.

## 8. Read and change boundaries

Adding convenient related search or recommendations does not allow a few top semantic-search results to replace the complete snapshot and global revision required by current graph validation. Changes use the operation contract current at that time.

Having retained information, retrieving it now, displaying it now and the user reviewing it are distinct. dot assists from available context; it does not claim to have checked information it has not read.

## 7. Persistence and Inbox notes from 2026-10-03

`owner_state` was removed; derive the global revision from the latest operation record. Save changed rows and the receipt atomically instead of deleting/re-saving all rows. There are no `initial_title`, `last_request`, `defer_zone` or persistent time-zone settings.

Inbox is a list of incomplete (`active` / `waiting`) tasks without a Project; it does not create separate entities/statuses for organized and unorganized input. Save original wording in the same task's notes, and let the caller provide an ordinary title. The user/LLM decides when to assign a Project; do not create Tags automatically. `waiting` is a saved status, while `is_deferred` is a filter derived from the user's/ancestors' `until`. Do not force an organization workflow into attribute update APIs. See the [ordinary-task integration change](../changes/change-20261003-inbox-task-model/implementation.md).
