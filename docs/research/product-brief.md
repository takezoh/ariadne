Product and vendor names and identifying source URLs have been removed from this historical reference. The observations below are retained research summaries, not independently verifiable source citations.

# Ariadne — Product Brief

> Historical synthesis of the 2026-10-02 discussion and research. The text below retains the terminology, proposals and implementation assumptions of that period; it is not the current product contract. This record predates the product's earlier rename from Ariadne and its later rename to Ariadne. Current positioning, audience and claim boundaries are defined in the active product design. At the time, the product provided structured task-data API/MCP tools and a shared UI; user prompts, LLMs, dot and caller-side schedulers chose the management method and execution. Caller-side Slack/email collection was tool composition, not a future Ariadne integration. See [PRODUCT](../../PRODUCT.md), [active product design](../design/product.md), [caller responsibilities](../design/assistance.md), the [2026-10-03 clarification](../note/note-20261003-llm-delegated-task-management-and-plugin.md), the [positioning decision](../note/note-20261003-product-positioning-audience-and-claim-b.md) and the [rename change](../changes/change-20261003-product-rename-generic-identifiers/change.md).

**The right things, at the right time.**

**Forget what is not needed now with confidence. Focus on what needs doing now.**

Ariadne is a personal daily task manager where people enter work and personal “to-dos” in natural language and ChatGPT organizes them into a task list. dot inside ChatGPT uses the input and saved tasks to organize, defer, and present items; Ariadne provides a thin read/change interface to D1 and a dedicated UI.

The goal is to save necessary information and prevent omissions while relieving the burden of remembering what is not needed now, so the user can focus on what should be done now through a task list suited to their purpose and context. The aim is not to automate GTD procedures unchanged, but to provide their benefits while also reducing the work of managing the system itself. The reference product informs the design of states, parameters, and perspectives, but Ariadne should not require the same management work of its users.

| Document information | Details |
| --- | --- |
| Version/date | v1.2 / initial and revised versions dated 2026-10-02 |
| Consolidated sources | Three design documents and two research notes. Appendix B maps all 37 original sections |
| Initial source revision | `the original source repository` at `fe4aa50e30598a16d8248e99e8488dba55bcf1e1` |
| v1.1 revision basis | [README](../../README.md) at `bbb151a5908022890d89239837c08321f05fdcef` and later discussion of forgetting safely and focusing on what matters. Not a re-verification of research or deployment |
| Current revision basis | `096f93dd1dd3167956f7520faff5250052a939e0`. Updated the target to daily tasks and a concrete explanation of natural-language input, saving, organizing into a task list, and reviewing the list. No change to research results or acceptance criteria |
| Additional sources checked for initial version | README and updated requirements at the initial source revision, plus implementation and live acceptance records for the benefit-led MVP |
| Purpose | Consolidated reference for product understanding, design decisions, and handoff. Does not authorize new implementation, deployment, or external execution |
| Product overview and usage | [PRODUCT](../../PRODUCT.md) |

This brief distinguishes **explicit product direction, adopted contracts, design hypotheses, research observations, and implementation/measured results**. Original documents are retained. Repeated explanations are consolidated instead of simply deleting detail; research sources, review scope and limits, design rationale, state exceptions, and open questions remain in this brief. When later updates adopt an earlier hypothesis, the history is retained while the current treatment is stated.

## Contents

[1. Concept and Audience](#concept) / [2. Problems and Benefits](#benefits) / [3. Relationship to GTD and state/view design](#positioning) / [4. Assistance Approach](#approach) / [5. Architecture and Responsibilities](#architecture) / [6. States and Parameters](#state) / [7. Perspectives](#perspectives) / [8. MVP Contract](#mvp) / [9. Example Experience](#scenario) / [10. Evaluation](#evaluation) / [11. Delivery Status and Process](#delivery) / [12. Risks and Open Questions](#questions) / [13. Research Basis](#research) / [Appendix A. Source Documents](#sources) / [Appendix B. Information Mapping](#coverage) / [Appendix C. Design Governance](#governance)

<a id="concept"></a>
## 1. Concept and Audience

> What needs attention is recognized when it needs attention.
>
> Necessary information becomes a ToDo or structure without requiring the user to keep managing it; what is not needed now can be deferred.

The audience is **daily tasks in work and personal life**. Handle separately tasks the user has decided to do, “things I want to do” that are not yet concrete, reference notes, items waiting for a reply or prerequisite, and candidates for future consideration. Do not turn something the user has not decided to do into a scheduled action as-is.

The problem is not only “the list is hard to operate.” The aim is to reduce the burden of deciding what to remember, how to organize it, what can be forgotten for now, and when it should come back to attention.

Obsidian Air Sync's Like Air is a UX reference, but Ariadne does not copy its transparency of synchronization directly. What matters is not making everything invisible; it is **ensuring necessary things receive attention without demanding unnecessary attention**. Silently hiding an important item is not considered burden reduction.

The user enters “to-dos” and change requests in natural language to ChatGPT. dot reviews the original input and existing tasks, then organizes necessary actions, parent-child relationships, and dependencies. The user can review the task list and request corrections, deferral, completion, or cancellation. A dedicated screen inside ChatGPT can also review and correct the same saved information.

### 1.1 Distinguish Input, Storage, Organization, and Display

| Operation or term | Specific meaning |
| --- | --- |
| Enter in natural language | Enter something to do into ChatGPT, e.g. “I want to prepare for the trip. I need to confirm the hotel booking and check what to pack.” |
| Save the original input | Retain the input before task creation. Uncommitted intentions and reference notes can be saved without creating tasks |
| Organize into a task list | Use the input and saved tasks to organize necessary actions and relationships. Do not add new commitments or deadlines without instruction |
| Review a list | Check which tasks to consider this time in an overall list, deferred list, or a view suited to a purpose |
| Request an update | Request a rename, due-date correction, defer, completion, cancellation, etc. Preserve required clarification and change contracts |

“Input content” and “a task the user decided to do” are not the same. Describe the target as “daily tasks”; specifically distinguish uncommitted input as “unorganized input” or “something I want to do but have not made concrete,” and reference information as “reference notes.”

<a id="benefits"></a>
## 2. Problems to Solve and Benefits to Provide

### 2.1 Core Benefit

**Forget what is not needed now with confidence. Focus on what needs doing now.** This is the intended outcome; it does not mean Ariadne's long-term effects have been proven.

Even after deciding “not now,” the user may remain burdened by remembering “I need to do that later.” The aim is not only to make a decision, but to set necessary information aside without losing it and direct attention toward a task list suited to the current purpose.

| Benefit | Burden reduced | Intended experience |
| --- | --- | --- |
| Forget what is not needed now with confidence | Repeated remembering and worry about where information was recorded | After input is saved, there is no need to keep checking it. It is not lost if forgotten and can be handled later |
| Focus on what needs doing now | Reviewing every task and mentally excluding irrelevant items | See a task list suited to purpose or context and direct attention to current work |
| Make it easier to start | Reinterpreting meaning and reconsidering the next action each time | Understand what can be done now and the context for doing it |
| Choose to defer or cancel (supporting choice) | Anxiety that something else might be more important | Choose a defer or cancellation and understand what happens next. The goal is not to repeatedly reconsider “not doing it” |
| Recover when circumstances change | Maintaining and comparing old assumptions/plans | Understand the impact of a change and what needs reconsideration |
| Avoid managing the management system | Classification, scanning every list, and supervising AI | Delegate organization without increasing the total burden of explanation, approval, and correction |

Task count, completed-task count, and notification response rate are not success measures on their own. Not doing something now, cancelling a commitment, and resting without worry can be part of the benefit. A few interactions are still a failure if something important is lost; fewer return visits are not success if the user is falsely reassured.

### 2.2 The Burden GTD Replaces and the Tradeoff to Improve with LLMs

GTD aims to put intentions and commitments into a trusted external system, clear the mind, and make it possible to choose what to do. In manual use, however, people take on the work of organizing, maintaining, and reviewing that system. [G1](#g1)

Ariadne should not merely shift the burden of remembering to the burden of organizing; it should also delegate as much organization, maintenance, search, and reconsideration as possible to dot. But if explanations to AI, full review of every result, approval, and error correction increase, the burden may only have moved.

The starting point for evaluation is **the burden of explaining, approving, correcting, monitoring, and interruptions caused by AI, subtracted from the burden of memory, organization, search, and reconsideration reduced**. This is a design criterion to turn into measured items alongside quality conditions against omissions; it is not an established numeric metric. [R2](#r2) and [R3](#r3) are references, not papers that directly tested this subtraction.

### 2.3 Saving and Forgetting Safely Are Different

An experiment found that making a concrete plan reduced cognitive interference from unfulfilled goals on another task. That experiment did not study whether simply receiving an AI-generated plan has the same effect. [R1](#r1)

Therefore, distinguish correct saving to D1 from the person's understanding of how it will be handled and ability to set it aside with confidence. Do not conflate technical save success, subjective confidence, and the actual rate of omissions.

### 2.4 Benefits and the Features That Support Them

Retain the earlier idea “choose what to do or not do now with confidence” as support for user agency. However, position the core product benefit as the result of that choice: “forget safely” and “focus.” This reframing does not remove the user's ability to choose deferral or cancellation.

| Role | Position in Ariadne |
| --- | --- |
| Benefit | Forget what is not needed now with confidence and focus on what needs doing now |
| Form provided | A task list that shows what to work on and necessary context |
| Presentation | Use perspectives to tailor which part of the same source of truth is shown to the purpose/context |
| Mechanism for setting aside | Defer retains content while removing it from the normal list until a specified time |
| Basis for confidence | Original input, corrections, and state are saved and can be reviewed or reconsidered later |

**The task list is the form provided, perspectives are how it is shown, and focus is the benefit.** An item not visible in a perspective is not necessarily deferred or deleted. Detailed boundaries are in §7.5. Neither perspective nor Defer guarantees active notifications or observation of external conditions.

<a id="positioning"></a>
## 3. Relationship to GTD and state/view design, and How Discussion Updated the Direction

### 3.1 Keep GTD's Functions, Not Its Procedures

Early discussion leaned toward using an LLM to perform GTD steps or operations in the reference product. The user asked “What benefits did GTD provide?” and “Shouldn't the rules and methods themselves change with an LLM?” The direction shifted from procedures to benefits.

| Do not make this a fixed goal | Function to retain |
| --- | --- |
| Run Capture, Clarify, Organize, Reflect, Engage in order every time | Do not lose input; clarify its meaning and handling when needed |
| Have the user classify everything and empty the Inbox | Save without organizing first, and later return it to the needed state and context |
| Read every list every week | Avoid missing old commitments and reconsider personal direction |
| Turn everything into a next action | Do not confuse reference, interest, unresolved issue, and commitment to act |
| Apply the two-minute rule mechanically | Reduce total cost including action, context switch, reconsideration, and approval |

The five GTD activities can help check for gaps, but do not justify a fixed conversation procedure or a backend state machine. The early phrase “an internal GTD system” should not mean that internal list structure is fixed. **Retain the reliability and assistance functions needed; reconsider workflows designed for human operation.** [G1–G4](#gtd-sources)

### 3.2 Structures That Preserve Meaning

Use the reference product as a reference for separating the meaning of dates/states, viewing the same data for different purposes, and combining conditions with order. The goal is not to import its feature count, forms, or maintenance of detailed classifications.

Parameters preserve different meanings inferred by dot. Perspectives retrieve and display the same source of truth for the purpose, helping the user focus on what needs doing now. Do not add parameters to make users configure the same system manually. Official manuals support feature meanings; they are not comparative studies proving Ariadne reduces burden. [O1–O3](#state-and-view-sources)

### 3.3 Assumptions Not Adopted

Do not assume Ariadne should be built as an app that runs fixed GTD procedures, a chatbot with a separate source of truth, or a standalone LLM coach/importance inference/recommendation/review engine. Do not preselect a rich backend intelligence, its own constant monitoring/notifications, or a number of agents. Public implementations and papers are material for consideration, not requirements by themselves.

<a id="approach"></a>
## 4. Assistance Approach: What Work to Take on for the User

### 4.1 Behavioral Policy

The following is guidance for designing assistance prompts. The existence of this text is separate from whether it has been delivered to and applied by the host.

> Help the user avoid repeatedly remembering daily tasks or making decisions just to organize them. Save input and organize intended actions into a task list.
>
> Preserve input, read existing state and the user's explicit policies, and organize what is needed. Do not turn interests, references, or unresolved items into new commitments without permission.
>
> Do not ask again for what is already known. Ask about matters only the user can decide when deciding now is valuable. Stay within the user's instruction and scope of approval.
>
> Preserve a state and context in which items not handled now can be handled appropriately later. Do not promise monitoring, notifications, or external actions that are unavailable.
>
> Prioritize the ability to forget what is not needed now with confidence and focus on what needs doing now, rather than filling management fields or increasing task count. Support the user's choices, including deferral and cancellation, without requiring the same decision repeatedly.

Adopt a proposal to maintain the benefit policy, situation-specific judgment guidance, and concrete tool contract separately. Do not fix the number of files/agents in advance; evaluate behavior with a small configuration. Capturing original input, revisions, necessary previews, and checking the same request after an unknown result are not things that can be dropped when assistance becomes more flexible.

### 4.2 Clarify in Stages, When Needed

Do not immediately turn “I'm concerned about clearing out my parents' home, but I haven't decided how much to do” into many tasks. Preserve that the user is considering it, the scope is undecided, and action is not yet committed. Avoid questions asked only to fill fields; do not require attributes that are not needed for saving.

Being able to save unorganized text does not mean it can be abandoned forever. Leave a state and context in which it can be reconsidered in an appropriate conversation or review. However, if the host cannot provide an execution opportunity, do not claim “I will definitely prompt you to review this at that time.”

Evaluate a proposal that retains the goal or high-level direction, makes the next action concrete when needed, and updates it as progress or assumptions change, rather than subdividing the full workflow at the start. [R5](#r5), [R8](#r8)

### 4.3 Reinterpret the Two-Minute Rule as a Principle of Total Cost

The GTD two-minute rule is explained through the efficiency principle that later rereading, thinking, and handling may cost more. [G2](#g2)

If an LLM reduces the cost of saving, resurfacing, research, or drafting, the result of deciding whether to handle something now may change. Include context switching, approval, and correction after failure, not only the task's duration. Do not conclude that every short task should interrupt the user or that “two minutes” should be replaced by another fixed threshold.

Information organization or drafting is different from an external action such as sending an email. A task being quick does not grant permission to perform an external action.

### 4.4 Split Review into Maintenance Checks and User Reconsideration

GTD Weekly Review includes not only list updates but review of what is on one's mind, past/upcoming calendar, waiting items, projects, and future possibilities. [G3](#g3)

| Function | Assistance direction |
| --- | --- |
| Check stale/inconsistent state, stalled items, missing next actions | dot inspects saved state and summarizes necessary issues |
| Check whether assumptions changed | Organize related information and candidate changes |
| Decide whether to keep or cancel a commitment | Help the user reconsider with context |
| Recall tasks or intentions not yet entered | Preserve opportunities for broad personal reflection |

The activity “read every item weekly” could change, but the function “reconsider my commitments and direction” remains. Do not treat AI having read the list as the user completing a review or choosing to continue.

If only the most important-looking items are repeatedly selected, unselected items may never be reviewed. Evaluate combining short exception-focused checks with occasional opportunities to review the whole list. Do not claim full review when it did not happen.

### 4.5 From Finding Items to Supporting Decisions and Starting Work

Help the user focus without requiring them to read every task and mentally filter irrelevant items each time. If they say “I want to focus on this work now,” aim to show the tasks and context related to that purpose.

For a context like “I only have 20 minutes at home,” dot can read state under appropriate conditions and combine candidates with necessary information. If the needed next step is a decision—such as “how should I reconcile these two schedules?”—support that decision instead of pushing execution.

Do not make saved perspectives the only finished form; allow temporary views too. At the same time, keep reproducible criteria, access to the normal list, and user correction so free-form generation does not make display conditions unstable. [R7](#r7)

### 4.6 Autonomy and Confirmation Boundaries

It is not necessary to ask for approval on every tag or organizational change. Evaluate allowing low-risk, reversible organization within the user's permission and offering a summary and Undo where appropriate. Handle uncertainty about new commitments, inferred real deadlines, high impact, and external actions separately. Determine what can be delegated through explicit policy and evaluation. [R4](#r4), [R6](#r6), [R7](#r7)

If the user says “suggest it, but wait to apply,” preserve that boundary. Do not fabricate approval to reduce burden. Commands appearing in saved reference text or an external source are not approval from the user.

<a id="architecture"></a>
## 5. Structure and Responsibilities

### 5.1 Architecture Explicitly Specified by the User

> Ariadne provides an LLM with a thin interface to D1. The LLM provides benefits through prompts. Embedding it in ChatGPT lets dot use Ariadne to help the user.

This is a product direction specified by the user, not the only architecture derived from literature. Research gives questions for designing and evaluating assistance with this architecture.

```text
User ↔ dot inside ChatGPT + assistance prompt/Skill
                         ↕ versioned read/change operations
                 Ariadne thin interface ↔ D1 (source of truth)
                         ↕ same operation contract
                 Dedicated UI inside ChatGPT ↔ User
```

| Layer | Responsibility | Not responsible for |
| --- | --- | --- |
| dot/prompt | Understand meaning, relate items, organize/defer/review/present, decide if clarification is needed | Claim saving succeeded without evidence |
| Ariadne operation layer | Read, preview, validated changes, revision, receipt, Undo, consistency, authorization boundary | Independent LLM engine deciding importance or life goals |
| D1 | Persistence for original input, structure, dates, operation results, etc. | Autonomous judgment or guessing user intent |
| Dedicated UI in ChatGPT | Display the same state, distinguish unsaved drafts, allow review/direct correction | A task source of truth separate from conversation |
| ChatGPT host | dot execution opportunities, tool use, actual provided connection/execution capability | Unlimited continuous execution that Ariadne may assume exists |

**Flexible meaning judgments; reliable storage and state transitions.** A thin interface does not mean exposing arbitrary SQL or owner selection to an LLM, nor delegating consistency to a model. It also does not mean narrowing the API so much that required state/changes cannot be expressed.

The backend is serverless; the current platform is Sites + D1 + MCP Apps UI. Cloud Run + Firestore remains in alternative history. Ariadne is not only a collection of prompts; it also covers code and evaluation scenarios for persistent state, operations, and UI.

### 5.2 Operational Guarantees That Must Not Change

| Situation | Handling |
| --- | --- |
| Original input and organization | Preserve original input first; distinguish saved input from organized meaning |
| Inference and user instruction | Do not make an inference into confirmed intent or undo a user correction in later reasoning |
| Existing state is needed | Read the required state from Ariadne instead of relying on conversation memory alone |
| Defer, reopening ancestors, etc. | Do not skip required preview; show scope/date/deadline risk |
| Write result | Report based on tool result and necessary reread |
| Update conflict | Preserve latest state and user's proposal; do not overwrite without permission |
| Unknown result | Keep operationId and request; check result or retry the same request |
| Undo | Use corresponding operation history and Undo contract rather than infer a reverse operation from conversation |

The current Skill combines full latest-list revision, original-input capture, necessary context read, structuring, required preview, apply, and reread. This is not a requirement for users to perform GTD steps each time; it is an operational dependency for reliable saving.

A retry with the same operationId must not change arguments. Do not issue a new ID that can duplicate data merely because the result is unknown. An old receipt is the result at the time of that operation, not the current list; distinguish it from latest state. On conflict, preserve the original proposal; applying a revised proposal is a new operation. [Current Skill](../../skills/action-tools/SKILL.md) · [Technical contract](../changes/change-20261001-structured-todo-mvp/implementation.md)

### 5.3 Prompt Delivery, Host Application, and Execution Opportunities

Verify separately that a prompt was saved in the repository, delivered to the host, followed by dot, and produced benefits.

The initial policy was not to treat the mere existence of `skills/action-tools/SKILL.md` as host integration. At the source revision, an implementation was added that defines assistance policy in `lib/assistance.ts`, includes it in MCP initialize.instructions and tool descriptions, and synchronizes the Skill. However, that implementation/deployment must not be mistaken for acceptance of every assistance behavior in real Work. [Progress record](../note/note-20261002-benefit-mvp-progress.md)

Also distinguish “can decide the right time” from “dot starts at that time.” Distinguish conversation start, list retrieval, and execution opportunities actually provided and permitted by the host. Do not implicitly add Ariadne's own monitoring, scheduler, or notification engine.

The initial direction to use Sign in with ChatGPT also does not imply a right to independent service-side inference or unlimited background execution. Eligibility, execution model, limits, and commercial terms need verification. “dot” in this brief refers to the intended assistance agent, not a guarantee of new platform capabilities.

<a id="state"></a>
## 6. States and Parameters

### 6.1 Separate Source of Truth, Display Criteria, and Recommendation

| Subject | Example | Responsibility |
| --- | --- | --- |
| Saved facts/intent | Original input, corrected title, parent-child, dependency, Defer date | D1 and change contract |
| Criteria-based projection/selection | Normal/deferred/completed, waiting reason, criteria match | Ariadne reads and deterministic criteria |
| Contextual assistance | What to work on now, whether to ask, whether to suggest deferral | dot and prompt |

Ariadne reads state under specified criteria and applies consistent changes. Do not bury an assistance policy about “what matters” inside display criteria.

What is stored, retrieved this time, displayed this time, and reviewed by the user are different. dot must not treat unread information as inspected. A few top results from related search do not replace a complete snapshot or owner-wide revision required to validate changes.

### 6.2 Current Model

The model below was organized by the original design at `4c86d536d65c22fffad8814abaf4568f51aac8af`; the `db/schema.ts` blob is the same at the source revision. Later cancellation operations also did not require a new migration. Model existence is separate from live acceptance of every operation.

| Saved entity | Main information | Meaning |
| --- | --- | --- |
| captures | Original text, source, status, revision | Separate input storage from later organization |
| tasks | title, notes, source_capture_id, status | Title/context/source relationship; open/done/cancelled |
| Parent-child | tasks.parent_id | What an item is part of |
| dependencies | dependent, prerequisite | Execution prerequisite, independent of parent-child |
| Dates | due_at, defer_until, defer_zone | Deadline and time to return to the normal list |
| Waiting | manual_wait and dependency reason | Distinguish reason for waiting from Defer |
| owner_state | schema_version, overall revision, timezone, etc. | Owner-specific state version and date interpretation |
| operations | operation_id, request/result/delta, before/after revisions, undo_of | Basis for retries, result lookup, and Undo |

The server-side authentication boundary determines the owner. Do not let a caller choose arbitrary owner or SQL. Do not make UI display state, unsaved drafts, or conversation memory a second source of truth beside D1.

The current model has no dedicated GTD project type, tags, estimated duration, Planned field, saved perspectives, or independent review-record attributes. Do not send unimplemented fields to the API or tell users they are available. [Schema](../../db/schema.ts)

### 6.3 Original Input, Organized Result, and Commitment

Distinguish successful saving from understanding and turning something into action. A URL or topic of interest is not necessarily a commitment to act. Do not turn input that the user has not committed to into a planned action merely to fit the schema.

There is a need to preserve what the user explicitly said, the basis for inference, and corrections, but that does not mean all dedicated fields must be added immediately. Determine from actual scenarios whether original input/notes/history are sufficient or whether repeated reuse needs structure.

### 6.4 Parent-Child, Dependency, and Projects

Parent-child means containment; dependency means a prerequisite for execution. Do not create dependencies from list order alone or infer execution sequence from containment. “Pack” and “confirm reservation” may both be part of “prepare for a trip,” but that does not make one a prerequisite for the other.

The “outcome to achieve” associated with GTD projects is a useful concept, but do not assume every current parent task has that meaning. A one-off action does not need to be forced into a project. Sequential, Parallel, and Single Actions List structures in the reference product are references for thinking through distinctions, not types in the current schema. [O3](#o3)

### 6.5 Waiting, Future Possibilities, and Defer

| Concept | Meaning | Boundary to preserve |
| --- | --- | --- |
| Waiting | Waiting on a dependency, another person, or an event | Time passing alone does not confirm an external fact |
| Future possibility | Something of interest that is not currently a commitment to act | Do not treat with the same pressure as incomplete tasks; dedicated field is a candidate extension |
| Defer | Intent to remove an item from the normal list until a specified time | Not completion, deletion, or changing a due date |

Broad GTD Defer includes putting actions not to be done now on a calendar or Next Actions. It is not the same as Ariadne's date-based Defer. Do not collapse Waiting For or Someday/Maybe into one “deferred” state either. [G4](#g4)

### 6.6 Defer, Planned, and Due

| Concept | Intent to preserve | Current mapping |
| --- | --- | --- |
| Defer | “Do not show this until Friday” | defer_until, etc. |
| Planned | “I want to work on this Friday” | Dedicated field is an extension candidate |
| Due | “This is needed by Friday” | due_at |

Do not turn “I want to do this next week” into an actual deadline. Do not disguise unsupported Planned meaning as Due or Defer; explain the practical available treatment, such as keeping it in the original text or notes. If Due and Defer conflict, show the impact; dot must not extend the deadline or clear deferral without permission. [O2](#o2)

### 6.7 Candidate Additional Parameters

The following list helps evaluate meanings to store and the benefits they support. It is not an adopted database schema or API.

| Candidate | Scenario where need should be checked | Caution |
| --- | --- | --- |
| Outcome/intent to act | Reuse and distinguish uncommitted input, future possibilities, and action commitments | Do not create unnecessary projects or commitments |
| Planned | Store desired work date separately from deadline | Do not substitute Due or Defer |
| Tags such as place/tool/person | Repeatedly find candidates suited to context | Avoid adding too many required fields |
| Duration/required energy | Filter candidates by available time or state | Allow unknown values and do not overtrust estimates |
| Waiting person/condition/check-in date | Waiting reason alone does not support follow-up | Separate scheduled time from actual arrival confirmation |
| Review record | Distinguish AI inspection from user's reconsideration | AI viewing does not mean user reviewed |
| Reasoning basis/correction history | Reuse to avoid repeating the same misunderstanding | Original input and user correction take priority |
| Recurrence | Distinguish fixed interval from interval based on completion | Out of MVP; separately design next occurrence and past completion history |

Do not ask simply because a value is missing. Define a scenario first; determine whether existing information can express it and whether structuring benefits outweigh management burden. The number of settings, including flags and review settings in the reference product, is not value by itself.

<a id="perspectives"></a>
## 7. Perspectives and UI

### 7.1 Views over the Same Source of Truth

The purpose of a perspective is not managing filters for its own sake, but to **focus on what needs doing now**. Show a task list relevant to the current purpose—work, home chores, or a project—and reduce the burden of rereading and filtering every item each time.

“Needs doing now” means an item to work on in light of the person's purpose, commitments, prerequisites, and context. It does not mean the AI imposes new obligations or lists everything that happens to be actionable.

A perspective is a view over the same task/input source of truth. Do not create separate stores for “Today,” “Home,” or “Short.” Adding an item to “Today” does not move it out of its project or create another copy.

If saved perspectives are added, separate **selection criteria, sort/grouping, and display format**. dot's recommendation or top candidates at a moment are separate from persistent source state. Do not remove a committed task from a fixed list because the LLM did not consider it important. [O1](#o1)

### 7.2 Current and Candidate Views

| View | Contents | Status/boundary |
| --- | --- | --- |
| Normal | Incomplete items without Defer; dependency waiting remains with reason | Adopted MVP contract |
| Deferred | Items hidden by user or ancestor Defer | Adopted MVP contract |
| Completed | Completed items | Adopted MVP contract |
| Cancelled | cancelled records | Read-only view added in later implementation. Confirmed in Codex MCP App; separate from acceptance of all Work conversations |
| Actionable now | Normal items that are in scope to act on and have no unresolved prerequisite | Proposal; does not replace normal list |
| Inbox/unorganized | Saved input whose meaning/handling is unresolved | Rereading captures is MVP; no independent screen or schema in this change |
| Review | Old waiting items, missing next action, decisions to continue, etc. | Dedicated view is a proposal; separate fact extraction from dot's semantic judgment |
| Today/Outlook | Due dates, planned work, resuming from Defer, etc. | Proposal; do not turn everything into “due today” |

The original state design treated normal/deferred/completed as current views. Display for cancelled is a later implementation note; it does not erase the historical state of the original source.

The UI need not present every view as an equally prominent entry point. What can be represented internally and how many entry points users must recognize are separate questions.

### 7.3 Specify a View in Natural Language

“I want things I can do at home, in about 15 minutes, and need this week” could be translated by dot into verifiable criteria if the required attributes are adopted. If they are not available, do not hide that limitation.

Unknown duration is not zero minutes. Distinguish returning only items with estimates from listing unknowns separately; do not silently exclude unknown items forever. Determine from existing state/context whether “needed this week” means Due, and ask only about ambiguity that changes meaning.

Say whether only some items were recommended or all items matching the criteria were searched. Do not explain omissions with “the AI thought so”; allow return to fixed list and review/correction of criteria. Save criteria when reuse is valuable, but do not add a saved view for every temporary question.

### 7.4 Availability, Order, and Importance

Available and First Available in the reference product are different. The first item in a Parallel project or treatment in a Single Actions List is structural, not a signal of “most important.” [O3](#o3)

Ariadne should also separate dependency-based availability, display order, and recommendation priority. Adding an Available-like view must not replace the existing contract that dependency-waiting items remain in the normal list with a reason.

### 7.5 Do Not Confuse Defer and Perspectives

| Mechanism | Benefit supported | What it changes | What it does not change |
| --- | --- | --- | --- |
| Defer | Forget what is not needed now with confidence | Removes item from normal list until saved Defer date | Content, due date, completion, dependency. Parent effects and child dates follow C1 |
| Perspective | Focus on what needs doing now | Changes which part/order of the same source of truth is shown for purpose/context | Other tasks' Defer, due dates, completion/cancellation/deletion state, membership/content |

For example, “show me work tasks now” alone does not defer or delete home tasks. Conversely, “I want not to think about this until Friday” concerns saving an intent as Defer, not merely a temporary display filter. Preserve the necessary confirmation/operation contract and access to overall and deferred content.

The policy of perspectives as views and the implementation of saving/reusing those views are separate. Saved perspectives/additional parameters remain extension candidates; clarifying this benefit does not declare them implemented or create new acceptance criteria.

<a id="mvp"></a>
## 8. MVP Scope and Adopted Contracts

### 8.1 In Scope and Out of Scope

The MVP is a structured ToDo with Defer and a dedicated UI inside ChatGPT. Users enter daily tasks in natural language; dot helps save, organize, defer, and review them. Input not yet committed to action is saved as original text rather than turned into a commitment.

Scope includes saving natural-language input, structuring necessary actions, parent-child/dependencies, optional due date, date-time Defer, waiting, lists/details, add/edit/complete/reopen/clear/cancel/Undo, conflicts/retries, and persistent storage across conversations. Preserve user ownership boundary implementation.

**General calendars/sync, time blocking, recurrence, active notifications, automatic observation of external conditions, and independent LLM inference are out of scope.** Consider Planned, tags, duration/energy, saved perspectives, and dedicated review attributes in separate changes if needed. Unorganized input can be read back, but a separate inbox screen or dedicated future-possibility schema is not automatic scope.

Conversation messages or Page checklists alone, and only opening an independent website in another tab, do not satisfy “dedicated UI inside ChatGPT.” Conversation and UI must use the same persistent state and confirm each other's changes through retrieval. [Requirements](../changes/change-20261001-structured-todo-mvp/requirements.md)

### 8.2 C1–C4: Product Decisions to Preserve

All four were approved by the user on 2026-10-01 with “all recommended.” Do not change them automatically due to the reference product references or revisions to assistance policy.

| Contract | Adopted behavior and rationale | Alternative not adopted |
| --- | --- | --- |
| C1: Parent Defer | Hide descendants from normal list. Preserve each child's individual date. Respect intent to defer a group and show impact on child deadline before applying | Hide only the parent and show children independently |
| C2: Parent/child completion | Reject parent completion with incomplete descendants. Even when all children are complete, parent is completed manually. Do not mark unfinished work or parent-specific checks complete automatically | Complete all children when parent completes / auto-complete parent when all children complete |
| C3: Date-only Defer | Show and save a specific 09:00 in configured IANA time zone. Keep the resumption instant fixed after setting changes. Avoid adding work-start settings and allow user to review/edit | Midnight, personal work-start time, or following destination local time |
| C4: Dependency waiting | Without Defer, keep in normal list with waiting reason. Keep dependency separate from user Defer so waiting items do not disappear indefinitely | Automatically move dependency-waiting items only to deferred list |

Switching normal/deferred views is computed on list retrieval from saved state and server time. It does not require an LLM decision on read or a scheduler write to clear Defer. Contract is resurfacing when retrieved after specified time; it does not guarantee a notification to a closed screen or second-by-second refresh on an open screen. Show refresh action and retrieval time.

Dependency resolution does not clear user Defer; arrival of time does not reopen completed items. Do not confirm external arrival without user input. Distinguish save failure, unknown result, and update conflict; preserve input and corrections.

### 8.3 Assistance Contract Adopted in Later Requirements Update

The three original design documents recorded some assistance approaches as hypotheses. Later, following the user's instruction “Update the requirements and MVP,” requirements at the source revision adopted PR01–PR07 for MVP. This brief reflects that update without treating long-term effects or all extension attributes as adopted.

| ID | Observable contract | Responsibility and acceptance scenarios |
| --- | --- | --- |
| PR01 | Distinguish committed tasks, reference notes, and uncommitted input; save original input first. Do not turn unresolved items into commitments or many tasks | dot + capture/read, S01, S02, S17 |
| PR02 | Do not ask for unnecessary storage attributes or repeat questions answerable from context. Clarify new commitments, meaning-changing ambiguity, and scope/date required by preview | dot, S17, S18, S21 |
| PR03 | Read existing state from D1 and prioritize same ID and user correction. Do not create duplicates or merge unconditionally | dot + D1/operations, S03, S15, S18 |
| PR04 | Separate parent-child/dependency, waiting/Defer, and desired schedule/deadline. Preserve unsupported meaning in original text/notes instead of another field | dot + core, S05–S11, S19 |
| PR05 | Return contextual candidates/reasons without presenting a partial recommendation as all items. Return to fixed list and direct-correction UI | dot + read/UI, S20 |
| PR06 | Respect user deferral/cancellation/corrections. Do not represent AI inspection as user review | dot + operations, S13, S14, S21 |
| PR07 | Report saves/conflicts/unknown results based on tool results; do not promise unverified monitoring, notifications, or external actions | dot + receipt/retry/UI, S02, S16, S22 |

Acceptance comprises seven flows and 22 scenarios: in-scope conditions from S01–S16 plus assistance S17–S22. Fixed five-step GTD, classification of all items, and approval of every item every time are not required; necessary previews and user approval boundaries still apply. [UX](../changes/change-20261001-structured-todo-mvp/ux.md)

### 8.4 Cancellation, Completion, and Undo

Later implementation saves cancellation as `cancelled`, separate from performing/completing the task. If descendants or dependencies remain, require explicit resolution; do not cascade changes silently. Use shared preview/revision/receipt/identical-retry/Undo contracts. Exclude cancelled items from parent/prerequisite choices and allow records to be viewed read-only.

Implementation/live verification scope for this behavior is in §11. Organizing documents is not new acceptance evidence.

<a id="scenario"></a>
## 9. Example Experience: Keep Waiting for Arrival Separate from Defer

Fictional example dated 2026-10-02, with Asia/Tokyo configured.

> I ordered parts for the chair. Assemble it when they arrive. Don't show this until next Monday.

Keep the action of assembling, the prerequisite of parts arriving, and Defer until Monday independent. Do not add a deadline not present in the input. Following C3, show the specific time **2026-10-05 09:00 Asia/Tokyo = 2026-10-05 00:00 UTC** before saving.

| Later event | Correct behavior |
| --- | --- |
| User reports arrival on Saturday | Clear arrival waiting, but do not clear Defer until Monday |
| Retrieve list after Monday and arrival is unconfirmed | Return to normal with waiting reason. It still would not qualify for an “actionable now” view |
| Both Defer and prerequisite are resolved | Treat as an action candidate |
| Task is completed before Monday | Do not reopen when the time arrives |
| Time arrives while screen is closed | No automatic notification guarantee; reflect state on next retrieval |

Use current waiting representation such as manual_wait or an appropriate prerequisite task; do not assume an unimplemented external-event attribute. Time passing is not evidence that the parts arrived. This flow tests independence of waiting/Defer, normal versus actionable-candidate views, preservation of completion, and the distinction between presentation and notification.

<a id="evaluation"></a>
## 10. Success Measures and Evaluation Design

### 10.1 Three Evaluation Layers

| Layer | What to verify | Evidence |
| --- | --- | --- |
| State/operations | Storage, relationships, dates, conflicts, retries, Undo, display projections | Deterministic input and expected state; tests of existing implementation |
| Prompt behavior | Interpretation, questions, suggestions, tool operations, response | Conversation + initial snapshot + operation sequence + final snapshot + response |
| User benefit | Total burden, confidence, clarity about starting, omissions | Longitudinal measurement compared with user assessment |

Separate CRUD correctness from quality of assistance. Do not pass based on readable responses without inspecting saved state. Record prompt/model version, tool schema, fixed time, and initial state. Set sample size, duration, and pass thresholds separately. Do not report the comparative evaluation as completed.

### 10.2 Approaches to Compare

| Approach | Value to isolate |
| --- | --- |
| A: Simple GTD run by a person | Existing management burden and benefits |
| B: Same GTD procedure performed by an LLM | Improvement from delegating only input/organization |
| C: Redesign that returns necessary decisions to the person | Additional benefit or harm from changing the procedure itself |

Keep model and persistence platform as similar as possible for B and C to separate model differences from workflow differences. Consider order effects and task differences. Do not generalize success on a few fictional conversations to long-term superiority in daily life.

### 10.3 What to Measure

Measure not only time spent managing tasks, but also the time and number of explanations, confirmations, corrections, and monitoring interactions with AI. At the same time, check omissions of important items, invented commitments/deadlines, duplicates, incorrect deferrals, stale assumptions, and whether corrections persist.

For the benefit of focus, candidate measures include how often the user rereads all tasks, the burden of mentally excluding irrelevant items, and the effort from stating a purpose to reaching the relevant task list. Narrowing the list is not success if necessary items are missing or the user must spend more effort checking AI selection. This is not a new mandatory Work acceptance condition.

Also measure whether the user returns to recheck less often and feels able to set things aside. Compare subjective confidence against actual omissions; false reassurance is not success. Do not judge by notification response rate or task completion count alone. [R1](#r1), [R9](#r9)

### 10.4 Scenarios That Connect Conversation and State Over Time

| Situation | Result to observe |
| --- | --- |
| Enter an intention that is not yet concrete in natural language | Preserve input without adding fictional commitments or unnecessary questions |
| Provide a URL as a reference | Do not turn it into another task without instruction |
| A related existing task exists | Reread it; do not duplicate or merge unconditionally |
| Say “I want to do this next week” | Do not invent a real deadline; explain treatment of unsupported meaning |
| Waiting overlaps with Defer | Handle prerequisite resolution and display time independently |
| Correct an item and move to another conversation | Prioritize the saved state corrected by the user |
| Update simultaneously in UI and conversation | Preserve the user's unsaved proposal and explain conflict |
| Save response becomes unknown | Do not claim success/failure; check result for the same operation |
| A project has made no progress for a long time | Detect the problem where it keeps being omitted from a small recommendation set |
| Say “stop for now” | Do not pressure the user to continue; preserve intent and necessary state |
| Host cannot initiate or observe events | Do not promise future notifications or confirmation of external facts |
| Focus on one piece of work (candidate measure from this revision) | Show its relevant task list without deferring/deleting other tasks, and allow return to full list |
| Do not think about something until Friday (candidate measure from this revision) | Preserve content and due date while deferring; resurface on retrieval after the date. Do not confuse with a display filter or automatic notification |

Evaluate not only a single input but the continuous state flow **capture → correction → defer → changed prerequisite → resurface → completion**. Confirm correct operation when dependency, parent-child, Defer, and completion interact, and verify that the same misunderstanding does not return.

### 10.5 Distinction from Work Acceptance

Do not add an A/B/C research comparison or long-term benefit measurement to the current Work deployment acceptance without authorization. The current requirements adopted S17–S22 for live Work acceptance through conversations, tool calls, initial/final state, and responses; that is separate from proving long-term benefits.

Authentication, cross-account separation, CSP, infrastructure-only, and cost checks remain outside the current Work acceptance scope. This does not remove owner-boundary implementation. Do not treat local checks, successful deployment, or reads/UI success in Codex as passing all Work scenarios. Do not mark MVP complete while in-scope defects or unverified items remain.

<a id="delivery"></a>
## 11. Development Status, Decision State, and Next Steps

### 11.1 Distinguish Information States

| Category | Contents | Treatment |
| --- | --- | --- |
| Explicit product direction | Daily cognitive load, GTD and state/view design as references, thin D1 interface, assistance by dot and prompt | Design basis |
| Adopted MVP contract | Structured ToDo, Defer, UI, C1–C4, operation guarantees, later-adopted PR01–PR07 | Follow requirements/implementation |
| Design hypotheses/extensions | Best form of exception-focused review, staged planning, Planned and other fields, saved views | Do not promote automatically to adopted/implemented |
| Research results | Primary sources, experiments, theory, proposals, personal practice | Preserve type and limitations |
| Implementation/deployment/acceptance | Local tests, host-specific behavior, deployed version | Report only what has evidence |

The three original design documents were created on 2026-10-02 against implementation revision `4c86d536d65c22fffad8814abaf4568f51aac8af` and recorded in `4130cafbe216f75339b2c4cd236aaa6367fcde83`. Preserve “documentation only,” “extension candidate,” and “deployment incomplete” as descriptions of that time, and distinguish them from later changes.

### 11.2 Implementation and Verification at the Source Revision

Based on updates through 2026-10-02 12:22 JST in the [benefit-led MVP progress record](../note/note-20261002-benefit-mvp-progress.md). Editing this brief did not run a new live test.

| Item | Recorded state |
| --- | --- |
| M0 | Basic round trip through UI/conversation/D1 in Work and restoration in another conversation was measured. This was not full MVP acceptance |
| Assistance instructions | Added implementation synchronizing lib/assistance.ts, initialize.instructions, tool descriptions, and Skill. Application across all Work conversations not yet accepted |
| Cancellation | Implemented cancel, shared operation guarantees, read-only view, and rejection when relationships remain. No new migration |
| Local checks | Recorded 21 storage/core checks, 5 UI checks, and successful typecheck/lint/build. Separate from live evidence |
| Deployment | Resumed after a pause and deployed to existing Sites. Latest record then had source `4cf3abe5ce38cde9ba25457420ed9d6f76f28f86`, deployment `appgdep_6abf2114bcc48191b126aa345ed40ea1`. Personal-only access and existing database preserved |
| Codex storage/read | Recorded pending retention of unresolved captures, no disguising desired dates as due_at, identical retry, rejection of different input, and Defer resumption by real time |
| Codex MCP App | After connection refresh/new panel, confirmed cancellation and unorganized-input views. UI cancellation followed by independent retrieval at revision 37; Undo restored open/normal at revision 38. Preserved title/notes/null due_at |
| Remaining acceptance | Conversation cancellation unverified with a connected model-facing schema that did not yet include cancel. Full Work conversation acceptance and assistance behavior S17–S22 incomplete. Long-term benefits unproven |

Do not use initial README statements such as “new implementation not deployed” to describe the entire current state. For deployment and host-specific acceptance, use later progress records/evidence. Do not treat Codex MCP App acceptance as Work conversation acceptance. See [Work handoff](../note/note-20261002-work-mvp-deployment-handoff.md) for concrete restart steps.

### 11.3 Development Order

Proceed in this order: **benefit → assistance scenario → desired dot behavior → required persistence and operations → prompt/tool/benefit evaluation**.

Instead of adding all GTD fields to the schema first, define a scenario such as “after entering something I want to do but haven't made concrete, I can set it aside without additional organizing work.” Specify what dot should read, save, ask, and return. Add only what is missing to support that scenario.

| Time horizon | Contents |
| --- | --- |
| Current core | Original input and organized result, parent-child/dependency, Defer and Due, distinction between normal list and recommendations, user corrections, operation guarantees, adopted assistance contract |
| Next candidates | Reusable views, optional tags/duration, future possibilities, review records, Planned, etc. Verify scenario and benefit |
| Separate decisions | Recurrence, calendar/time blocking, external observation, proactive display. Out of MVP and not guaranteed future features |

Do not read initial broad ideas such as calendar sync, multi-organization busy sync, independent inference, or autonomous activation as current requirements that cross responsibility boundaries. The initial plan was removed; current MVP scope and exclusions are consolidated in the [development guide](../development.md) and [requirements](../changes/change-20261001-structured-todo-mvp/requirements.md). Pricing, public access, and terms remain undecided; do not change sharing for the personal-only verification.

If a gap is found, do not immediately add intelligence to the backend. Determine whether the missing part is instruction, context passed, state representation, operation capability, or host execution opportunity. Do not guarantee that prompt changes alone always solve it either.

<a id="questions"></a>
## 12. Risks and Open Questions

| Issue | What to check or control |
| --- | --- |
| False reassurance | Measure real omissions as well as save success or subjective confidence |
| New supervision burden | Check whether the workflow has merely become full review or perfunctory approval |
| Invented commitments | Do not turn uncommitted input/reference notes into actions or preferred dates into deadlines |
| Items never reviewed | Allow review of items omitted from small recommendations; do not claim unread full list was checked |
| Lost corrections | Prioritize user corrections and original intent across conversations |
| Stale assumptions | Allow reconsidering whether to continue rather than carrying forward old plans |
| Too much/little automation | Separate permitted low-risk organizing from decisions that require user input. Neither constant approval nor unconditional automation is the goal |
| Assumed host capabilities | Separately verify available execution/observation/notification and whether guidance was delivered/applied |
| Premature state/schema | Do not send unsupported fields; preserve meaning in notes or design a separate extension |
| Commercial/operational terms | Do not settle eligibility, auth/SDK version, limits, performance/cost, pricing, or visibility based on stale assumptions |

Research leaves open whether a user can feel confident with only AI-organized state, whether exception-focused checking prevents omissions, whether repeated corrections preserve user intent, whether supervision burden stays below the original burden, and whether the host offers the needed execution opportunities.

The conclusion is **there is a rationale and evaluation agenda for redesigning around benefits, but Ariadne must test whether it works**. Do not confuse the absence of long-term proof in research with the absence of implementation contracts or limited measured results.

<a id="research"></a>
## 13. Research Evidence and Design Implications

### 13.1 Scope and Interpretation of Evidence

This section consolidates information recorded in two research notes. Those notes were checked on 2026-10-02. No new review of external primary sources, replication, or implementation audit was performed while integrating them here. “Reviewed scope” below refers to what the original notes report.

The research was limited to topics raised in discussion; it is not a comprehensive systematic review. Technical and research evidence comes from primary sources, author papers, and publisher or institutional records. Public individual practices are treated as a separate evidence category. Extensive source reproduction and redistribution of paper files are avoided.

| Type | Sources | What it supports | What it cannot establish |
| --- | --- | --- | --- |
| Method sources | G1–G4 | GTD's goals and mechanisms | Causal proof of effectiveness |
| Cognitive experiments | R1, R3 | Effects of planning and offloading costs in specific tasks | The same effects for AI-generated plans or Ariadne |
| Theory and design principles | R2, R4 | Ideas about external memory and division of initiative | Effectiveness of a current LLM implementation |
| Research proposal | R5 | A concept for long-term assistance including GTD | Results of evaluations that were not conducted |
| Limited LLM-assistance studies | R6–R9 | Benefits and problems in dialogue, planning, and intervention | Long-term superiority in everyday life |
| Public practice and implementation | N1, N2 | Implementation and operational references | Independent validation of effectiveness or safety |
| Official product manuals | O1–O3 | Functional meanings of states, dates, and views | Comparative experiments on reducing cognitive load |

<a id="gtd-sources"></a>
### 13.2 GTD Primary Sources

<a id="g1"></a>
#### G1. Official GTD: What Is GTD?

Source: [Getting Things Done official site](https://gettingthingsdone.com/what-is-gtd/). Reviewed scope: official overview.

Intentions and commitments are handled through a trusted external system by capturing, clarifying, organizing, reviewing, and engaging. The system includes information that does not call for action; the aim is to clear the mind and make choices, not to maintain lists for their own sake.

**Limitations and implications:** This describes a method; it does not prove causal effects. Treating its five stages as a checklist of needed functions rather than a fixed dialogue sequence is Ariadne's interpretation.

<a id="g2"></a>
#### G2. David Allen: The Two-Minute Rule (2020)

Source: [Official GTD, 2020-05-29](https://gettingthingsdone.com/2020/05/the-two-minute-rule-2/). Reviewed scope: transcript of Allen's explanation.

The rule is explained as an efficiency principle: for a short action, the later cost of rereading, reconsidering, and handling it may be greater than doing it now.

**Limitations and implications:** An LLM may change the costs of saving, resurfacing, and preparing, which could change how the principle applies; no new fixed threshold has been established. Include context switching and approval in evaluation.

<a id="g3"></a>
#### G3. GTD Weekly Review Checklist

Source: [Official one-page PDF](https://gettingthingsdone.com/wp-content/uploads/2014/10/Weekly_Review_Checklist.pdf). Reviewed scope: full document and rendered page.

In addition to action lists, it covers open loops, past and upcoming calendar items, waiting-for items, projects, and future possibilities. It combines updating records with reviewing interests and commitments.

**Limitations and implications:** This is not an experiment on delegating weekly reviews to AI. Moving mechanical checks to dot does not justify removing the user's reconsideration. Keep AI checks distinct from the user's review.

<a id="g4"></a>
#### G4. GTD Workflow Map

Source: [Official one-page PDF](https://gettingthingsdone.com/wp-content/uploads/2014/10/workflow_map.pdf). Reviewed scope: the full rendered diagram.

Defer broadly includes placing actions that are not to be done now on a calendar or in Next Actions. Reference material, future possibilities, and items awaiting someone else's delegated work branch into other categories.

**Implication:** Do not collapse GTD Defer, Ariadne's date-based Defer, Waiting For, and Someday/Maybe into one state. Confusing them could hide actions that are available but simply not intended for now.

### 13.3 Cognitive Research and Division of Work Between People and Systems

<a id="r1"></a>
#### R1. Masicampo & Baumeister (2011): Planning and Interference from Unfulfilled Goals

Citation: E. J. Masicampo, Roy F. Baumeister. *Consider It Done! Plan Making Can Eliminate the Cognitive Effects of Unfulfilled Goals*. Journal of Personality and Social Psychology. DOI: `10.1037/a0024192`.

Source: [Author-hosted PDF](https://users.wfu.edu/masicaej/MasicampoBaumeister2011JPSP.pdf). Reviewed scope: abstract, experiment description and conclusions, rendered PDF.

**Finding:** Making a concrete plan reduced interference in thought from unfulfilled goals. This supports considering whether handling an item is defined, not merely whether it is recorded.

**Limitations:** This studied plans made by participants. The effect of merely receiving an automatically generated LLM plan is untested. It did not evaluate the full GTD process in everyday life.

**Design hypothesis:** Treat saving to D1 and the user's ability to set the matter aside with confidence as separate success conditions.

<a id="r2"></a>
#### R2. Heylighen & Vidal (2008): A Cognitive Science Account of GTD

Citation: Francis Heylighen, Clément Vidal. *Getting Things Done: The Science behind Stress-Free Productivity*. Long Range Planning 41(6), 585–605. DOI: `10.1016/j.lrp.2008.09.004`.

Source: [VUB research record](https://researchportal.vub.be/en/publications/getting-things-done-the-science-behind-stress-free-productivity/). Reviewed scope: institutional citation and abstract. The record does not show that the full paper was reread.

**Finding:** A theoretical account of GTD as a cognitive system that includes external memory and interaction with the environment.

**Limitations:** This is not an intervention trial establishing a causal effect of GTD.

**Design hypothesis:** Design the total burden across the person, dot, persisted state, and interaction surface rather than relying on human memory alone.

<a id="r3"></a>
#### R3. Chiu & Gilbert: The Cost of Offloading

Citation: Gavin Chiu, Sam J. Gilbert. *Influence of the physical effort of reminder-setting on strategic offloading of delayed intentions*. Quarterly Journal of Experimental Psychology 77(6), 1295–1311. DOI: `10.1177/17470218231199977`. Published online 2023-08-29; issue dated June 2024.

Source: [Publisher abstract and citation](https://journals.sagepub.com/doi/abs/10.1177/17470218231199977). Reviewed scope: abstract and citation.

**Finding:** In two preregistered experiments, reminder setting decreased as its physical effort increased; lower-effort offloading better compensated for memory load.

**Limitations:** The experiment concerned physical effort and did not directly measure the burden of approving or correcting AI. Do not infer an effect size for LLM use.

**Design hypothesis:** Evaluate the ongoing effort required to use a feature, not only whether it exists.

<a id="r4"></a>
#### R4. Horvitz (1999): Mixed-Initiative User Interfaces

Citation: Eric Horvitz. *Principles of Mixed-Initiative User Interfaces*. CHI 1999.

Source: [Author-hosted PDF](https://erichorvitz.com/chi99horvitz.pdf). Reviewed scope: design principles in the paper and rendered PDF.

**Finding:** The paper considers benefits of assistance alongside uncertainty about goals, mistaken assumptions, interruption costs, and the user's ability to stop or correct the system.

**Limitations:** This is not a long-term study of LLMs or GTD.

**Design hypothesis:** Neither asking about everything nor automating everything is the goal. Return decisions to the user based on the value of assistance and the impact of errors. Keep model guidance separate from guarantees enforced by code.

### 13.4 LLM Assistance for Planning, Reflection, and Presentation

<a id="r5"></a>
#### R5. Wang（2024）：GOLF

Citation: Ben Wang. *GOLF: Goal-Oriented Long-term liFe tasks supported by human-AI collaboration*. arXiv `2403.17089v2`.

Source: [Author's paper](https://arxiv.org/html/2403.17089v2). Reviewed scope: its GTD-based architecture and evaluation plan.

**Finding:** The proposal draws on GTD to decompose long-term goals into activities and tasks, with people and AI collaborating on information gathering, decisions, and real-world actions. Its use of an overall plan that gains detail as work proceeds is a useful reference.

**Limitations:** Evaluation is described as a plan; the source does not report measured benefits. A multi-agent architecture is not a requirement for Ariadne.

**Design hypothesis:** Support the detail needed now and later updates as work progresses instead of decomposing every step upfront.

<a id="r6"></a>
#### R6. Abbas et al.（CHI 2026）：PITCH

Citation: Adnan Abbas et al. *“Having Lunch Now”: Understanding How Users Engage with a Proactive Agent for Daily Planning and Self-Reflection*. arXiv `2509.24073v4`. DOI: `10.1145/3772318.3790957`.

Source: [Author's paper](https://arxiv.org/html/2509.24073v4). Reviewed scope: user study, results, and design discussion.

**Finding:** A 14-day deployment with 12 participants captured adjustment, resistance, and disengagement as well as acceptance of suggestions. Rigid dialogue, premature responses, and promises of unavailable assistance emerged as problems.

**Limitations:** The sample and duration were limited; this does not establish long-term effects of replacing GTD in everyday life.

**Design hypothesis:** Evaluate concise, necessary clarification rather than scripted interviews, and allow suggestions to be ignored, deferred, or corrected. Check capability before promising assistance.

<a id="r7"></a>
#### R7. Feng et al.：Cocoa

Citation: K. J. Kevin Feng et al. *Cocoa: Co-Planning and Co-Execution with AI Agents*. arXiv `2412.10999v4` (initial version 2024).

Source: [Author's paper](https://arxiv.org/html/2412.10999v4). Reviewed scope: experiments, field study, and design discussion.

**Finding:** The work studies collaborative planning and execution through editable plans. It includes a 16-person experiment and a one-week field study with seven participants. Directly editing plans to guide execution is a useful reference.

**Limitations:** The main setting is research work, not all of an individual's everyday GTD. A nonsignificant usability difference does not prove equivalence. The risk of perfunctory approval is a design concern discussed by the authors, not a quantitatively established general law.

**Design hypothesis:** Provide a UI for directly correcting the same state alongside conversation. Do not assume that adding controls or approval buttons will reduce burden.

<a id="r8"></a>
#### R8. Wang & Liu (2025): Using ChatGPT for Long-Term Life Planning

Citation: Ben Wang, Jiqun Liu. *Your plan may succeed, but what about failure? Investigating how people use ChatGPT for long-term life task planning*. arXiv `2512.11096v1`.

Source: [Author's paper](https://arxiv.org/html/2512.11096v1). Reviewed scope: methods, interview results, and limitations.

**Finding:** Interviews with 14 people examine the value of goal decomposition and reflection, as well as problems with generic or overly ideal plans and adapting to personal circumstances and change.

**Limitations:** The study did not follow participants through long-term goal completion and does not derive an objective plan-success rate from self-reported experience.

**Design hypothesis:** Preserve assumptions, unresolved questions, and original intent alongside plans, and allow the decision to continue to be reconsidered when circumstances change.

<a id="r9"></a>
#### R9. Pu et al.（2025）：ProMemAssist

Citation: Kevin Pu et al. *ProMemAssist: Exploring Timely Proactive Assistance Through Working Memory Modeling in Multi-Modal Wearable Devices*. arXiv `2507.21378v1`.

Source: [Author's paper](https://arxiv.org/html/2507.21378v1). Reviewed scope: 12-person experiment, results, and limitations.

**Finding:** The system uses wearable data and a working-memory model to select intervention timing. It reports more selective interventions and a higher positive response rate than an LLM baseline. However, absolute positive responses were 32 versus 31, task completion time did not differ significantly, and workload measures did not improve uniformly.

**Limitations:** This was a limited physical-task experiment, not evidence about ordinary ToDos or long-term life assistance. Do not equate response rate with overall life benefit. It also does not show that prompts alone are enough to select presentation timing.

**Design hypothesis:** Distinguish returning an item to the candidate set from interrupting the user with it now, and consider the context, state, and evaluation needed. This paper does not justify adding sensors or a dedicated working-memory engine to Ariadne.

### 13.5 Public Practices and Implementations

<a id="n1"></a>
#### N1. mikonos/LLM-GTD

Source: [Public repository](https://github.com/mikonos/LLM-GTD). Reviewed scope: public descriptions such as its README as of 2026-10-02. This refers to a mutable README; it is not an execution evaluation pinned to a commit.

**Finding:** It describes sharing Markdown state and a GTD Skill across coding assistants. It separates mechanical capture, clarification, and organization from human involvement in doing and reviewing work.

**Reference:** Keep workflow instructions, persistent state, and connections to execution environments separate.

**Not adopted or verified:** Making Markdown Ariadne's source of truth, CLI-oriented UX, a fixed list structure, or the quality and operational reliability of the public code. The code was not run or audited.

<a id="n2"></a>
#### N2. Practice Described in the a reference-product user forum

Source: GTD is the ontology, the reference product is the system of record, and ChatGPT is the coach (source URL removed). Posted by TheTallDesigner. The thread dates to August 2026. Reviewed scope: the author's description of their workflow.

**Finding:** The workflow separates GTD's meaning, the reference product as source of truth, and ChatGPT as coach, while organizing and reviewing against existing state. Its care in distinguishing a write attempt from verified success is a useful reference.

**Limitations:** This is one person's self-report, not an official reference-product vendor design recommendation or independent effectiveness study.

**Difference from Ariadne:** Ariadne does not require GTD's fixed taxonomy and reconsiders the assistance workflow from the desired benefits. It references role separation without copying the workflow.

<a id="state-and-view-sources"></a>
### 13.6 Reference Design Documentation

References are pinned to **reference product version 4.9.2**. The review date is 2026-10-02, as recorded in the source note; this is not a claim that it was the latest version at that time. This is not a comprehensive comparison of purchasing terms, prices, platform differences, or detailed runtime behavior. The app itself was not exercised.

<a id="o1"></a>
#### O1. Custom Perspectives

Source: Official 4.9.2 manual (source URL removed). Reviewed: conditions, display, grouping, and ordering.

**Finding:** Saved views over existing items can use nested All, Any, and None conditions to filter by status, dates, tags, and other fields, and configure grouping and order.

**Proposal:** Keep one source of truth and distinguish filtering, display order, and dot's recommendations. Do not create a saved view for every temporary question. Distinguish rule-based filtering from free-form selection, and not being recommended from not matching a filter.

<a id="o2"></a>
#### O2. The Inspector

Source: Official 4.9.2 manual (source URL removed). Reviewed: dates, estimated duration, tags, review, recurrence, and related settings.

**Finding:** It provides Defer, Planned, Due, estimated duration, tags, flags, review intervals, and recurrence. Some configurations support multiple tags and mutually exclusive tag groups.

**Proposal:** Distinguish when to set something aside, when it is planned, and when it is due. Do not treat more attributes as inherently valuable; allow unknowns and do not confuse inference with confirmed intent. For review, distinguish user review from AI checks; for recurrence, distinguish fixed intervals from completion criteria and past completion from the next occurrence. These are not decisions to extend the current MVP.

<a id="o3"></a>
#### O3. Perspectives

Source: Official 4.9.2 manual (source URL removed). Reviewed: project structures, availability, and list behavior.

**Finding:** The structures include Sequential, Parallel, and Single Actions List. Available differs from First Available: in Parallel, the first item in order is First Available; in a Single Actions List, several actions may qualify. This does not mean “most important.” The manual also describes project completion as involving completion of child items.

**Proposal:** Separate inclusion, prerequisites, order, and importance. Do not infer sequential dependencies from list order. Ariadne prioritizes C4, which keeps dependency-blocked tasks in the normal list, and C2, which prevents completing a parent with unfinished descendants. These differences from the reference product are deliberate product decisions that prevent unfinished work from being marked complete accidentally.

### 13.7 Design Inferences from Primary Sources and Research

| Design question | Main evidence | Inference for Ariadne |
| --- | --- | --- |
| Why is saving alone insufficient? | G1, R1 | Also check whether the user understands how an item will be handled and can set it aside with confidence. |
| How can management burden be reduced? | R2, R3 | Include supervision of AI, not only capture and categorization, in the total burden. |
| How much should the system ask or automate? | R4, R6, R7 | Return decisions to the user according to uncertainty and impact. |
| How much should the workflow change? | G2–G4, R5 | Preserve needed functions rather than fixed stages. |
| How should plans be updated? | R5, R7, R8 | Preserve original intent and assumptions; refine and reconsider in stages. |
| When should an item be presented? | R6, R9 | Separate candidate selection from intervention timing, and evaluate with actual host capabilities. |
| How should persistence and judgment be separated? | N1, N2 | Separate dot's prompt from D1 as the source of truth. |
| How should state and its presentation be separated? | O1–O3 | Use semantically distinct states and purpose-specific views over the same state. |

These are Ariadne design inferences, not direct conclusions from the literature. The sources provide reasons to investigate redesigning assistance through prompts, but do not establish long-term superiority over conventional GTD.

Correct the interpretation of the initial research as well: do not treat GOLF as evaluated; retain the limited conditions of PITCH and Cocoa; distinguish ProMemAssist response rates from benefits; and distinguish individual practice from experiments. Do not assume that fixed five-stage processing, categorizing every item, simple automation of weekly reviews, or a recommendation engine inside Ariadne is required.

<a id="sources"></a>
## Appendix A. Sources Integrated and Reference Points

At the initial read point, the five integrated documents had the same blobs as in the preceding commit. The SHAs below record the source materials used for the first edition. The technical observation baseline for the design documents was `4c86d536d65c22fffad8814abaf4568f51aac8af`; their documentation commit was `4130cafbe216f75339b2c4cd236aaa6367fcde83`. This brief separately cross-checked later requirements and measured records.

| Key | Source | Document ID / status | Blob SHA |
| --- | --- | --- | --- |
| P | [Concept and Benefits](../design/product.md) | design-product / active | `4f30e2b5e4c5f45d6d60fb925e57af1e06cd812b` |
| A | [Assistance Approach and Responsibilities](../design/assistance.md) | design-assistance / active | `5a0d2392ae03554d598e18f5a51ef33e3bd34ab6` |
| S | [State, Parameters, and Perspectives](../design/state-and-perspectives.md) | design-state-and-perspectives / active | `4033f2fafa7c77f4d93c2c08e29b0516a6540f43` |
| G | [GTD, Cognition, and LLM Research](../note/note-20261002-gtd-benefits-and-llm-research.md) | note-20261002-gtd-benefits-and-llm-research / published | `353c969080ae8f8ffdcb353a2568a1dbdf58fdb2` |
| O | [State and View Research](../note/note-20261002-state-and-view-design-research.md) | note-20261002-state-and-view-design-research / published | `27bbc1f992e6cc882b3f57bbee868fa44235e23e` |

All were created or updated on 2026-10-02. The three design documents cover system, policy, and area scopes respectively. Their original frontmatter, IDs, relations, tags, source_paths, and contract checks remain in the source files; their substantive responsibilities and constraints are consolidated in Appendix C.

Additional cross-checks: [requirements](../changes/change-20261001-structured-todo-mvp/requirements.md) (PR01–PR07 and scope), [progress record](../note/note-20261002-benefit-mvp-progress.md) (deployment and host-specific measurements), and [README](../../README.md) (entry point, initial plan, and operational context). External references, versions, and reviewed scope are listed in §13.

<a id="coverage"></a>
## Appendix B. Mapping of All 37 Source Sections to This Brief

The mapping below makes the destination of information explicit; it is not an automated proof of semantic equivalence. The comparison includes research findings, limitations, unverified areas, boundaries on what was not adopted, and the distinction between implementation and hypothesis. The source documents are not deleted or overwritten.

| Source section | Location in this brief | Content retained |
| --- | --- | --- |
| P §1 Concept | §1 | Everyday and work/private life, cognitive load, and distinction from Like Air |
| P §2 Benefits | §§2, 10 | Retains the original five benefits and choice support, refocusing around setting things aside with confidence and focus; measures that do not count as success; confidence versus omissions |
| P §3 Relationship to GTD | §§3.1, 4 | Shift from process to benefit, five functions, and withdrawal of a fixed internal GTD workflow |
| P §4 Explicit direction | §5.1 | User direction, dot, D1, UI, thinness, and consistency |
| P §5 Role of the reference product | §§3.2, 6, 7, 13.6 | Representing meaning and views without transplanting its workflow |
| P §6 Decisions, hypotheses, and status | §8.3, §11, Appendix A | Each information state, old baseline, distinction between documentation and implementation, initial-plan boundary |
| P §7 Design process | §2.2, §10, §11.3 | Benefit-first order, total burden, and quality conditions |
| A §1 Structure | §5.1 | Responsibilities and non-responsibilities of all five layers, diagram, and risk of an overly thin API |
| A §2 Prompt | §4.1, §§5.2–5.3 | All policy elements, tool contract, partition proposal, delivery and application |
| A §3 GTD redesign hypotheses | §§4.2–4.5 | Progressive clarification, two-minute rule, review, and decision-supporting views |
| A §4 Autonomy and reliability | §4.6, §5.2 | Approval boundary, all eight operational scenarios, and the distinction between reference text and instruction |
| A §5 Execution opportunities and delivery | §5.3, §8.2 | Host capability, distinction from notification, and file presence versus application |
| A §6 Evaluation | §10 | Three layers, A/B/C comparison, measures, all original 11 scenarios, recording conditions, unresolved thresholds; this revision adds two benefit scenarios as evaluation candidates |
| A §7 Relation to MVP | §§8, 10.5, 11.3 | Acceptance scope, excluded tests, owner preservation, and gap analysis |
| S §1 Three responsibilities | §6.1 | Separation of source of truth, projections, and assistance policy |
| S §2 Persistent model | §6.2 | All eight persisted items, existing attributes, owner, and unsupported dedicated attributes |
| S §3 Separate meanings | §§6.3–6.6 | Original input and commitment, parent and dependency, waiting/future possibility/Defer, Planned and Due |
| S §4 MVP contract | §8.2 | C1–C4, projection on list read, and preservation of completion |
| S §5 Perspectives | §7 | One source of truth, conditions/display/recommendations, all views, natural language and unknown values |
| S §6 Extension candidates | §6.7 | All eight candidates, needed scenarios, constraints, and not asking merely because a field is blank |
| S §7 Continuous state example | §9 | Input, exact time, ordering of arrival and Defer, completion, notifications, implementation boundary |
| S §8 Reads and changes | §5.2, §6.1 | Complete snapshot and revision; distinction among retention, retrieval, display, and confirmation |
| G §1 Questions and scope | §13.1 | Focused, non-exhaustive research; primary sources and individual practice; no republication |
| G §2 Summary and evidence | §12, §13.1 | Evidence types, what can and cannot be said, limits on long-term effects |
| G §3 GTD sources | §13.2 | G1–G4, sources, reviewed scope, and interpretation |
| G §4 Cognition and design principles | §13.3 | R1–R4, citations, dates, DOI, findings, limitations, hypotheses |
| G §5 LLM assistance | §13.4 | R5–R9, versions, sample sizes, results, limitations, implications |
| G §6 Public practice | §13.5 | N1–N2, author/date/scope, unaudited status, unofficial status, and difference from Ariadne |
| G §7 From research to design | §13.7 | Original seven questions, evidence, and inferences; responsibility split is user direction |
| G §8 Corrections and open questions | §§3, 12, 13.7 | Corrected initial interpretation, avoiding overstatement, unresolved questions |
| O §1 Purpose and version | §13.6 | Pinned 4.9.2; O1–O3; not a latest-version, hands-on, or pricing comparison |
| O §2 Perspectives | §7.1, §13.6 O1 | Nested conditions, saved views, and distinction between recommendations and filter mismatch |
| O §3 Dates and availability | §§6.6–6.7, §13.6 O2 | Three dates, duration/tags/flags/exclusive groups, review and recurrence |
| O §4 Structure and Available | §6.4, §7.4, §13.6 O3 | Three structures, First Available exceptions, order/importance |
| O §5 Boundaries on transfer | §§3.2, 6–8, 13.6 | Attributes, normal list, order, type, dates, review/recurrence, parent completion |
| O §6 Connection to GTD | §§3, 6.5, §13.2 G4 | Roles of GTD and state/view design; avoiding a mistaken reading of broad Defer |
| O §7 Conclusions | §3.2, §10, §13.7 | Reference for meaning and views; effects require separate evaluation |

Responsibilities, invariants, and prohibitions from the original machine-readable metadata are distributed through the body and consolidated in the following appendix. Changes from hypotheses to contracts in later requirements, the dropped-item view, and deployment progress are dated in §§8 and 11.

<a id="governance"></a>
## Appendix C. Design Governance and Information Updates

### C.1 Responsibilities and Invariants from the Original Design Documents

IDs are local to the source documents. This section adds no new operational constraints; it preserves the meaning of the original design metadata in a readable form.

| Source document and ID | Contract meaning | Original check type |
| --- | --- | --- |
| P RESP-001 | Design dot's assistance and Ariadne's state and operations as one experience, starting from benefits | responsibility |
| P INV-001 | dot is responsible for judgment; do not assume an independent LLM engine inside Ariadne | review |
| P INV-002 | Distinguish policy, MVP contract, extension hypothesis, and measured result | review |
| A RESP-001 | Separate dot's judgment policy from Ariadne's operational guarantees | responsibility |
| A INV-001 | A prompt cannot create successful persistence or external execution; claims must follow tool evidence | contract |
| A INV-002 | Flexible assistance must not omit original-input retention, necessary previews, or conflict handling | review |
| S RESP-001 | Do not confuse persistent state, display conditions, and recommendations | responsibility |
| S INV-001 | Conversation and UI use the same D1 source of truth; do not duplicate state by view | contract |
| S INV-002 | Handle parent-child/dependency, waiting/Defer, and Defer/deadline independently | contract |
| S INV-003 | Do not replace the normal list with recommendations or a future availability view | review |

### C.2 Provision, Dependencies, Prohibitions, and Variability

| Scope | Provides / depends on | Fixed / variable |
| --- | --- | --- |
| Product (P) | Provides purpose and a basis for design decisions; depends on user discussion, adopted requirements, and research | Fix benefit priority, dot's responsibility, and user choice. Prompt wording, validated workflows, and additional attributes may vary. |
| Assistance (A) | Provides assistance policy, responsibilities, and evaluation of conversation plus state; depends on benefits, versioned operations, and actual host capabilities | Fix D1 as source of truth, evidence for outcome claims, and priority of explicit corrections. GTD stage order/frequency, instruction structure, and permitted reversible organization may vary. |
| State (S) | Provides separation of meaning and display, and maps current attributes to candidates; depends on MVP, schema, and the reference product documentation | Preserve C1–C4, time semantics, and fixed projections. Additional attributes, saved-view representation, and recommendation explanations require separate design. |

Prohibited practices include using GTD steps or completion counts as substitutes for benefits; recording a concept as implemented or validated; implicitly adding an independent backend LLM; treating unavailable context or notifications as if they were used; sending unsupported attributes; or conveniently converting unknown values into definite ones.

### C.3 Failure Responsibilities and Trust Boundaries

Detect burden transfer and false reassurance through evaluation, then revise the assistance policy. Preserve the user's correction when meaning was wrong. Explain unsupported meanings as unsupported; handle persistence conflicts and unknown outcomes through the operation contract.

Distinguish LLM inference from user intent, saved reference text from approval to act, and a selected subset from the complete snapshot. Determine persistence success from operation results.

### C.4 Document Roles and Compatibility

This brief is the integrated entry point for understanding the product; the One-pager is its summary, and omitted details can be traced back here. The three original design documents remain domain-specific governance, and the two research notes remain records of their research date. If they change, review this mapping and the reference baseline as well.

Changes to principles or concrete contracts require explicit requirements and design changes. Editing documents does not change C1–C4, schemaVersion 2, or Work acceptance scope. New candidates require a separate change design.

The original statements “prompt examples not deployed,” “documentation only,” and “do not add Work completion conditions” describe the scope at the time they were written. The later explicit adoption of PR01–PR07 is described in §8.3; implementation and deployment are separated in §11.2. This edit does not mark independent review, long-term effects, or all Work acceptance as complete.

In v1.1, benefit wording, the role of perspectives, the distinction from Defer, and evaluation candidates were updated to align with a later README revision. Original choice support was retained; research, sources, limitations, existing contracts, and measured records were not removed or changed. The first-edition mapping was retained and the revision context added.

In v1.2, the README was organized around user operations and experience, the One-pager around audience, value, structure, and scope, and this brief around detailed design decisions and evidence. The main text and related design documents were aligned around entering everyday tasks in natural language, having ChatGPT save and organize them, and reviewing or changing them in a list. The original 37 sections, research, sources, limitations, contracts, and measured results were retained; features, acceptance conditions, and deployment status were not changed. Appendix A's SHAs remain records from the first edition.

**People should gain the confidence, clarity, and freedom of choice that GTD seeks without having to manage GTD. Along with what to move out of mind, they should be able to delegate the work of deciding what to bring back, when, and at what level of detail.** This is central to Ariadne's design and evaluation.

In the user's words, that benefit is: **“Set aside what you don't need right now with confidence. Focus on what you need to do now.”**
