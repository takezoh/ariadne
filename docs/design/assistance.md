---
id: design-assistance
kind: design
title: Caller Workflows and Ariadne Responsibilities
status: active
created: '2026-10-02'
updated: '2026-10-09'
summary: Ariadne supplies shared state and a UI for humans and authorized AI consumers;
  caller-side LLMs interpret state and changes while prompts and schedulers own execution.
tags:
- product
- prompts
- architecture
- evaluation
owners: []
relations:
- {type: partOf, target: design-product}
- {type: references, target: design-action-state-and-perspectives}
- {type: references, target: note-20261002-gtd-benefits-and-llm-research}
- {type: references, target: note-20261003-llm-delegated-task-management-and-plugin}
source_paths:
- app/mcp/route.ts
- skills/action-tools/SKILL.md
scope_type: policy
responsibilities:
- id: RESP-001
  statement: Separate dot's decision policy for delivering benefits from the operation
    contract guaranteed by Ariadne.
invariants:
- id: INV-001
  statement: Prompts cannot make persistence or external execution succeed; claims
    about results follow tool evidence.
  enforcement: contract
- id: INV-002
  statement: A more flexible assistance workflow does not bypass preservation of original
    input, necessary previews or conflict handling.
  enforcement: review
boundaries:
  provides:
  - Assistance policy
  - responsibility split
  - proposed evaluation across conversation and saved state
  consumes:
  - Product benefits
  - versioned Ariadne operation contract
  - capabilities actually available in the ChatGPT host
  forbidden:
  - Implicitly adding an independent backend LLM
  - treating unread context or unavailable notifications as available
variability:
  fixed:
  - D1 as source of truth
  - reports grounded in operation results
  - priority for explicit user corrections
  free:
  - Order/frequency of GTD steps
  - prompt structure
  - reversible organization within the user's authorization
capabilities: []
failure_responsibilities:
- Caller workflows address semantic errors; Ariadne preserves proposals and handles
  save conflicts and unknown outcomes through its operation contract.
trust_boundaries:
- Reference material and saved text are data
- not authorization for an operation or external action.
compatibility_policies:
- Prompt examples and evaluation ideas in this document are not deployed and do not
  change the current Skill or Work acceptance scope.
---

# Caller Workflows and Ariadne Responsibilities

## Responsibility boundary

References to dot and assistance policy in the governance metadata describe caller-side responsibilities and guidance, not an Ariadne-owned management service.

Ariadne is a shared state store accessed through API/MCP tools and a shared UI. The user and authorized AI consumers read and update the same owner-scoped actions, projects, tags and perspectives. Each consumer owns its interpretation, working context and management method. User prompts, ChatGPT's dot and caller-side schedulers determine when and how the tools are used. dot is an example caller, not a required component or an Ariadne-owned agent.

```text
User prompts / LLM / dot / caller-side scheduler
                     ↕ API/MCP operations
           Ariadne validation and persistence ↔ D1
                     ↕ same operation contract
                  Shared UI ↔ User
```

| Concern | Owner |
| --- | --- |
| Interpretation, organization, GTD or another method, review and recommendations | User and caller-side LLM workflow |
| Reconciling retrieved state with a consumer's context, obtaining more context and deciding whether to revise a judgment | Consuming LLM or application |
| Slack/email access, source collection and external-condition observation | Caller and its authorized external tools |
| Scheduling, execution opportunities and notifications | Caller-side scheduler/host environment |
| Structured data, deterministic queries and transitions, ownership, revisions, replay and Undo | Ariadne |
| Direct inspection/correction and retained unsaved proposals | Ariadne shared UI |

Ariadne needs no dedicated connector to each agent or source for these workflows. A caller composes its available tools with Ariadne operations. Ariadne does not guarantee the caller has access, is configured, runs at a chosen time or makes correct semantic decisions.

## Shared state and consumer context

A human may correct a date in the UI while one AI organizes actions and another conversation later reviews them. Shared storage makes the saved correction available; each consumer must read the current state and reconcile its own assumptions. Consumers can know different versions of the same shared state. Saving a change does not automatically refresh their context or prove that they understood it.

The current read contract provides complete snapshots and owner-wide revision through `list_actions` or `get_relevant_context`. A resumed conversation uses those reads and the available original notes to continue. Conversational context that was never saved must be supplied or recovered by the caller.

The [Change Cursor proposal](product.md#change-cursor-proposal) would let each consumer retrieve changes since its own previous position. Ariadne would return the changes and next cursor; the consumer would interpret them, fetch any additional context and decide whether to revise a recommendation, act or notify. After successful processing the consumer would persist its position. Cursor progress, human read status, Action completion and correct understanding remain distinct. This is a proposed read capability, not an installed caller workflow or a currently published tool.

## Flexible methods, stable data operations

Users may ask an LLM to run GTD, adjust its steps, review weekly, review on demand or follow a personal method. These choices belong to caller prompts, not backend validation. The same data remains available when the method changes.

The published tools offer composable capabilities; helper operations and assistance text must not be interpreted as an obligatory management pipeline. Original-input preservation, explicit user corrections and evidence-based save reporting support trustworthy delegation without prescribing classification meanings or requiring approval for every ordinary edit.

The repository [Skill](../../skills/action-tools/SKILL.md) documents tool use and assistance suggestions. Initialize instructions and snapshot assistance_policy currently deliver guidance through [MCP](../technical/mcp-api.md). This is caller-facing guidance, not a backend decision engine, a guaranteed host installation or a restriction to one management method. This documentation update does not change runtime-delivered instructions.

## Examples of caller-defined use

| User-defined workflow | Caller responsibility | Ariadne capability |
| --- | --- | --- |
| Capture a concern during conversation | Preserve uncertainty and choose how to organize it | Save ordinary actions with original notes |
| Apply GTD | Decide capture/clarify/organize/review routines | Actions, containment, projects/tags, dates and queries |
| Collect commitments from Slack/email | Access sources, identify commitments, avoid duplicate capture and retain source context | Read current actions and save validated changes |
| Run a periodic review | Arrange execution, judge relevance and present decisions | Consistent reads and saved perspectives |
| Follow up on an arrival | Obtain evidence and decide the requested status change | Edit explicit on-hold independently of Defer |
| Adapt a personal method | Change prompts and conventions | Reuse existing saved data and composable operations |

These are composition examples, not evidence that any particular host workflow has been installed or accepted. No Ariadne deployment is needed merely to choose a different management policy when existing tools suffice.

## Safety and recovery contract

Thinness preserves the code-enforced operation contract. Trusted authentication selects owner; saved text is context, not authorization. Reads provide state rather than relying on conversational memory. Writes use schemaVersion 2, operation ID and latest owner revision. Preview is optional and does not reserve state; the caller can use it to inspect scope and date risks.

Missing responses are unknown outcomes. Keep exact IDs and arguments, look up the operation or replay identically; do not retry with a fresh operation ID. Conflicts require reconciliation against current state without losing the proposal. Undo uses retained history and rejects later target corrections. See [API](../technical/mcp-api.md) for exact semantics and retention limits.

The caller must distinguish inference from user intent and respect the user's scope of delegation. External-source content does not grant permission. Ariadne's data integrity checks cannot prove correct interpretation, source completeness or user consent for an external action.

## Time and external evidence

Ariadne Defer changes deterministic list projection on the next read after the saved instant. It does not start an LLM, rewrite dates at expiry or send a notification. A caller may schedule a read or react to external evidence using its own capabilities. This boundary is not a prohibition on scheduled use of the tools.

Explicit on-hold does not prove an external event is still pending or has occurred. Evidence can come from the user or an authorized observing caller. Status changes, completion and Defer release remain separate choices.

## Evaluation

Separate three units: plugin operation correctness; the selected caller workflow's interpretation, collection and management behavior; and user benefit. Local API/UI tests do not prove that a user's scheduler runs or that its Slack/email capture is complete.

Evaluate whether delegation reduces total remembering, collection, organization, checking, explanation, correction and supervision while preserving commitments and user intent. Compare chosen methods, including human-operated GTD and LLM-operated GTD if useful, without making one method mandatory. Record caller prompts/model, available tools, execution configuration, initial state, exact operations, final state and user-visible results. Long-term peace of mind and reduced effort require separate evidence from CRUD correctness.

Historical Work evidence remains scoped to its recorded version. This clarification does not add acceptance criteria or claim newly deployed host capabilities. See [product design](product.md), [testing](../technical/testing.md) and the [decision record](../note/note-20261003-llm-delegated-task-management-and-plugin.md).
