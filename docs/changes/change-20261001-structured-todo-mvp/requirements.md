---
change: change-20261001-structured-todo-mvp
role: requirements
---

# MVP Requirements — Specify

## Decision and Status

Based on the product direction from 2026-10-02 and the user's instruction to update the requirements and MVP, revise the MVP to combine assistance benefits with operational reliability. Preserve C1–C4 and existing S01–S16; add assistance scenarios S17–S22. The acceptance scope is seven flows and 22 scenarios.

The existing M0 round trip between the in-Work UI, conversation, and D1 has been measured. In-scope MVP implementation, deployment, and Work acceptance were completed on 2026-10-03. The [final acceptance record](../../note/note-20261002-work-benefit-acceptance.md) preserves measurements and out-of-scope items. This does not mean independent review or long-term product-benefit validation is complete.

## Rationale

- [MVP scope in the development guide](../../development.md#mvp-requirements). Carries forward the MVP conditions from the removed initial plan.
- Explicit instructions in the conversation: “Remove calendar sync too,” “Keep it simple: a structured ToDo with Defer,” and “The backend should be serverless.”
- [Rationale for C1–C4](decision-evidence.json): user selected “all recommended.”
- Approval to begin: “okay” to the proposal to do requirements first, and “yes” to creating them directly.

## Scope

Natural-language input storage, structuring required ToDos, parent-child and dependency relationships, optional due dates, date-time Defer, normal/deferred/completed lists, detail editing/completion/reopening/un-Defer/cancellation, persistent storage across conversations, and user data isolation.

General calendar features, time blocking, recurrence, active notifications, automatic observation of external conditions, and independent inference are out of scope. The post-Work choice of Sites + D1 and the API/database/auth contracts are recorded in [design](implementation.md).

## Product Goal and Updated MVP (2026-10-02)

Users enter daily tasks in natural language and ChatGPT saves and organizes them so they can safely forget what is not needed now and focus on what they should do now. Preserve the user's ability to defer or cancel. Evaluate reduced management burden against the burden of explaining, approving, correcting, and monitoring AI. Task and completion counts are not proxies for success.

Design rationale: [Product Direction](../../design/product.md), [Assistance Design](../../design/assistance.md), and [State Design](../../design/state-and-perspectives.md). Adopt the following as the MVP assistance contract. Measure long-term benefit magnitude and superiority separately.

| ID | Requirement and observable result | Responsibility | Scenarios |
| --- | --- | --- | --- |
| PR01 | Distinguish committed tasks, reference notes, and input not yet committed to action; save original input first. Do not turn unresolved input into new commitments or a large set of tasks | dot + capture/read contract | S01, S02, S17 |
| PR02 | Do not ask for attributes unnecessary for storage or repeat questions answerable from existing context. Confirm new commitments, ambiguities that change meaning, and the scope/date required by current preview | dot/prompt | S17, S18, S21 |
| PR03 | Read necessary existing state from D1 and prioritize the same ID and the user's corrections. Do not create duplicates or merge unconditionally | dot + D1/operation contract | S03, S15, S18 |
| PR04 | Distinguish parent-child/dependency, waiting/Defer, and desired schedule/deadline. Preserve unsupported attributes in original input/notes rather than disguising them as Due or Defer | dot + core | S05–S11, S19 |
| PR05 | Return contextual candidates and reasons without describing a partial recommendation as a complete list. Allow return to fixed normal/deferred/completed lists and direct-correction UI | dot + read/UI | S20 |
| PR06 | Respect the user's deferral, cancellation, and corrections. Do not treat AI inspection as a user-reviewed status | dot + operation contract | S13, S14, S21 |
| PR07 | Report save, conflict, and unknown result based on tool results; do not promise unverified monitoring, notifications, or external execution | dot + receipt/retry/UI | S02, S16, S22 |

### MVP Composition and Scope

- ChatGPT dot and its prompt/Skill provide assistance. Ariadne provides versioned read/change/storage operations and a dedicated UI for the same state.
- Save input that is not yet concrete as a capture and organize it when needed. Retrieval of unorganized input is required, but this change does not add a separate inbox screen or dedicated future-candidate schema.
- Preserve existing contracts for parent-child/dependency, due dates, Defer, waiting, completion/reopen, cancellation, Undo, conflicts, and retries.
- Use conversations to provide contextual suggestions, review, and corrections based on existing state. Do not require the five fixed GTD steps or classifying every item. Avoid requiring approval of every item on every turn while preserving necessary preview and the user's authorization boundary.
- Planned, tags, duration/energy, saved perspectives, dedicated review records, and recurrence remain extension candidates. Confirm their need in real scenarios and their benefits in a separate change.

### Completion Verdict

Operational acceptance covers in-scope conditions for S01–S16; assistance acceptance covers S17–S22. Verify assistance through real Work conversations, tool sequences, initial/final state, and responses; saving a prompt in the repository alone does not pass. Do not declare MVP complete while in-scope defects or unverified scenarios remain.

Authentication, separation across other accounts, CSP, infrastructure-only tests, and cost remain outside this Work acceptance scope. Preserve owner-boundary implementation. Evaluate long-term benefits later; do not generalize a small set of fictional scenario passes into proof of effectiveness.

## Dedicated UI Requirement (Added 2026-10-01)

The user's instruction that the MVP “also includes building a dedicated UI inside ChatGPT” is mandatory. Open the dedicated UI inside ChatGPT and operate normal/deferred/completed lists, parent-child/dependency/waiting reasons, and task details; support add/edit/complete/reopen/Defer/clear/cancel/update. Conversations and the UI use the same persistent state and can confirm one another's changes by retrieval.

Conversation text or a Page checklist alone does not satisfy the MVP. Opening only a separate website tab also does not satisfy “dedicated UI inside ChatGPT.” If Sites is considered, demonstrate UI display/operation inside ChatGPT and connection to the source of truth. Continue preliminary verification of an approach without operating external infrastructure; do not waive the UI requirement to claim success.

## Experience Contract

1. Distinguish saved input from organized results. Do not turn reference information into actions without authorization.
2. Allow correction of task content, parent-child relationships, and dependencies; explicit corrections take priority.
3. Defer is not completion, deletion, or changing a due date. The saved deferral can be reviewed explicitly.
4. Guarantee resumption on a list retrieval after the specified time. Do not guarantee notifications while the screen is closed or second-by-second refresh while open. Show a refresh action and retrieval time.
5. Do not reopen completed tasks when a dependency resolves or a date arrives. Do not mark an external arrival confirmed without input from the user.
6. Distinguish save failure, unknown result, and update conflict. Do not lose input or corrections during recovery.

## Settled Product Decisions

### C1: Parent Defer

- Adopted: Hide descendants from the normal list too. Preserve each child's individual date.
- Alternative: Hide only the parent and display children independently.
- Rationale: Matches the intent to defer the group. Show effects on child deadlines before applying.
- Status: Approved by the user (“all recommended” on 2026-10-01).

### C2: Parent/Child Completion

- Adopted: Block parent completion while a child is incomplete. Even when every child is complete, complete the parent manually.
- Alternative: Complete all children when the parent completes / auto-complete the parent when all children complete.
- Rationale: Avoid marking unperformed work and parent-specific checks complete unintentionally.
- Status: Approved by the user (“all recommended” on 2026-10-01).

### C3: Date-Only Defer

- Adopted: Display and save a specific 09:00 in the configured time zone. Preserve the resumption instant after saving.
- Alternative: Use midnight / the user's work start / the destination's local time.
- Rationale: Avoid adding a work-start setting to the MVP while letting the user review and edit the resumption time.
- Status: Approved by the user (“all recommended” on 2026-10-01).

### C4: Displaying Dependency Waiting

- Adopted: When there is no Defer, display the waiting reason in the normal list. Keep dependency and manual Defer independent.
- Alternative: Automatically move dependency-waiting tasks only to the deferred list.
- Rationale: Distinguish a prerequisite from a user's decision to defer and prevent an item from disappearing indefinitely.
- Status: Approved by the user (“all recommended” on 2026-10-01).

## Handoff to Design

Use the [settled UX flows and acceptance scenarios](ux.md), [structured Specify output](requirements-plan/plan.json), [source Explore output](requirements-plan.json), and [verification record](verification.md). Treat C1–C4 as selected and expand them into technical contracts. Decide database, host, authentication, API, and conflict handling in design.

## Scope of Post-Verification Changes

Do not change the product experience or C1–C4. The latest Work verification is limited to display, operations, and saved results. Do not add authentication, other-account isolation, or infrastructure-only tests to the acceptance completion criteria. Revise the technical platform in design based on Work measurements.
