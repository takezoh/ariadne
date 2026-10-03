---
change: change-20261001-structured-todo-mvp
role: verification
---

# Requirements Verification

## Checks Performed

- Compared the latest MVP scope in the conversation with the development plan. Calendar and time blocking were not added as mandatory acceptance conditions.
- Added observable entry/exit conditions to all seven flows and Given/When/Then plus counterexamples to all 16 scenarios.
- Distinguished Defer from due date, completion, and dependencies; considered parent-originated deferral, individual dates, deadline risk, prerequisite reopening, and cancellation conflicts.
- Bound the user's “all recommended” answer to C1–C4 and kept entry/exit conditions, scenarios, and sources for all flows in the Specify output. No product choices remain unresolved.

Structural, ID, reference, and local-link checks succeeded. `docs lint` also succeeded with no warnings. Results are recorded in [requirements-check.json](requirements-check.json).

## Limits of Verification

This was a consistency review of the text and structural/link checks, not an independent review, usability study, implementation test suite, or real ChatGPT connection test. External delegation produced no work because of a communication failure; subsequent documents were created directly in the main session based on user authorization.

Reproducible structural checks verify that every flow in `requirements-plan.json` is referenced by scenarios, each scenario has non-empty Given/When/Then/counterexample, IDs are unique, MVP non-goals are retained, and Markdown links exist. Document schema is checked with dev-docs lint.

## Current Completion State

Deployment of the new implementation to Sites and in-scope Work acceptance of S01–S22 were completed on 2026-10-03. No additional migration is needed. The latest verdict is the 2026-10-03 update in the [Work acceptance record](../../note/note-20261002-work-benefit-acceptance.md). Preserve M0 and earlier unverified/failure statements as historical records of their execution time. G2 infrastructure-only and cost checks are out of scope. The change is done.

## Design Verification Plan and Traceability Table

The technical design was recorded, but the following checks had not yet been performed at that point. Assign core/storage/host/UI observations to every scenario. Do not use an Emulator to claim real database billing, contention, or cold-start behavior.

| Scenario | Technical requirements | Implementation/verification owners | Success to observe and counterexample to rule out |
| --- | --- | --- | --- |
| S01 | FR02 | T3, T5 | Confirm original input and saved result; required actions appear as parent-child or dependencies; reference URL remains context. / Counterexample: automatically add tasks to read or organize an unrequested URL. |
| S02 | FR02, FR12, FR14 | T2, T3, T5 | Distinguish saved/unsaved input and pending organization; retry does not duplicate tasks. / Counterexample: discard input on a failed response or claim a save succeeded without evidence. |
| S03 | FR03 | T1, T4, T5 | Shopping item displays independently while content, due date, and Defer date remain. / Counterexample: deleting a task or inferring a new deadline just because it was detached from a parent. |
| S04 | FR03 | T1, T2, T5 | Show why a change is rejected and preserve the original structure. Apply the same treatment to dependency self-reference/cycles. / Counterexample: cyclic tree disappears from list or error is shown as success. |
| S05 | FR04, FR05 | T1, T4, T5 | Before time, item is absent from normal list and shown in deferred list with date/due. Retrieval after Wednesday 09:00 returns it to normal with Friday due unchanged. / Counterexample: Defer changes due date to Wednesday or item remains hidden until the following day. |
| S06 | FR06 | T1, T4, T5 | Show the specific date, 09:00, Asia/Tokyo before save and in details. Preserve the resumption instant after timezone setting change and convert displayed time. / Counterexample: resume at an undisplayed device time or move the instant when setting changes. |
| S07 | FR04, FR05 | T1, T4, T5 | Before Wednesday, P and descendants leave the normal list, with parent Defer shown as reason. After Wednesday, P and A return while B stays deferred through Friday. / Counterexample: parent Defer overwrites children's individual dates or clearing it also returns B. |
| S08 | FR04, FR07 | T1, T3, T4, T5 | Show that parent causes Defer and guide user to clear the parent's Defer. Do not leave an individually cleared child invisible. / Counterexample: report child Defer cleared while it stays absent from normal list. |
| S09 | FR04, FR07 | T1, T3, T4, T5 | Before save, show affected due dates and deferred scope; let user correct date or save intended Defer. Show that past/current date will not keep item deferred. / Counterexample: extend due date, clear user Defer without permission due to overdue state, or hide indefinitely using a past date. |
| S10 | FR08 | T1, T5 | Show B's dependency wait cleared but keep it deferred through Friday. Dependency waiting without Defer remains visible with reason in normal list. / Counterexample: return B despite user Defer simply because dependency resolved. |
| S11 | FR08, FR10 | T1, T5 | User-reported arrival clears waiting on another party. After reopening D, incomplete C shows waiting reason again. Do not reopen a completed prerequisite task automatically. / Counterexample: claim an external arrival was confirmed without input or reopen completed work when D resumes. |
| S12 | FR09 | T1, T4, T5 | While a child is incomplete, block P completion and identify A. After all children complete, keep P open until user completes it. A task with no children can be completed directly. / Counterexample: parent completion completes every child or all children completing auto-completes a parent with its own checks. |
| S13 | FR05, FR10 | T1, T4, T5 | After completion, remove from normal/deferred and retain in completed. On reopen, show original Defer: future returns to deferred, past to normal. When reopening child of completed parent, show the ancestor reopen scope. / Counterexample: reopen completed task just because Defer time arrives or create an invisible incomplete child beneath a completed parent. |
| S14 | FR11, FR13 | T2, T4, T5 | Preserve newer correction and show why Undo is unavailable and latest content. Undo non-conflicting Defer to prior view. / Counterexample: Undo rolls back another screen's correction or a related task's completion. |
| S15 | FR01, FR13, FR14 | T0, T2, T3, T4, T5 | Same user retrieves saved state and can retry after conflict based on latest content. Other user's tasks appear in neither list nor read by known ID. / Counterexample: save only in conversation history and lose it in another conversation, or expose content by guessing another user's ID. |
| S16 | FR01, FR12, FR14 | T0, T2, T3, T5 | Input text does not grant permissions; verify same add result. Retry if not saved; do not duplicate if already saved. / Counterexample: execute pasted instruction to expose another user's data or assume communication failure means failed save and add a duplicate. |

G1 (T0): vendor/SDK and real ChatGPT connection. G2 (T5): cost, latency, and contention on real Cloud Run/Firestore. Both were unverified at that time. Only design structure, traceability, dependency DAG, and local links were checked here. Distinguish these from independent review, automated tests, and live acceptance.

### Design Structural Check Results

[design-check.json](design-check.json): Passed traceability from S01–S16 to technical requirements/implementation units, 14 EARS requirements, 5 NFRs, 7 boundaries, dependency DAG across 6 units, local links, and code fences. No G1/G2 live measurements. A traceability table does not prove behavior is correct.

## Dedicated UI Acceptance Conditions (Added 2026-10-01)

- Given: The user who uses Ariadne in ChatGPT sees a dedicated UI with normal/deferred/completed lists and task details.
- When: They add/correct/Defer/clear/complete/reopen/cancel in the UI, update the same task from conversation, and retrieve it in the UI.
- Then: Both paths show the same persistent state; relevant C1–C4 and S01–S16 behavior, save result, conflicts, and retrieval time are visible in UI. Retrieval after a Defer date returns the item to normal.
- Counterexample: Pass a setup where only conversation text, a Page checklist, or a website in an external tab is operable.

Display/operation/reload in real ChatGPT was unverified at the time. Pages storage tests are evidence of storage only, not dedicated UI acceptance. Sites + D1 also needs a connection test satisfying this UI condition.

## Live Work M0 Update (2026-10-01 21:29 JST)

The [Work M0 measurement record](../../note/note-20261001-work-m0-sites-proof.md) operated Sites + D1 + MCP Apps UI inside a real Work conversation. Confirmed email authentication, personal plugin connection, UI add, close/reopen, bidirectional conversation updates, and restoration in a separate Work conversation without copying history. This resolved “display/operation/reload in real ChatGPT is unverified” for the M0 basic path only.

This is not full MVP acceptance. Live testing found that a rename request ID accepted different input and that refresh after conflict lost an unsaved proposal. Required operations for structuring, Defer, parent-child, dependency, completion, and cancellation were missing, so S01–S14 were not met. Separate conversation and stale revision rejection for S15 passed live; same-add retry for S16 passed, but cross-account isolation and real host communication loss were not measured. Host had existing CSP-off setting, not a pass with CSP on. See the record's traceability table and [measurement JSON](../../note/evidence/work-m0-live-20261001.json).

G1 advanced for the basic connection path in that account. Do not infer G2 cost/latency/production behavior or full MVP completion. Requirements, C1–C4, and draft status of the change were retained at that time.

## Verification Scope Finalized (2026-10-01 22:42 JST)

At the user's direction from 22:29–22:42 JST, limit verification to display, operations, and saved results in ChatGPT Work. Include dedicated UI, saving/restoration/retrieval in another Work conversation, mutual UI/conversation updates, Defer, parent-child, dependencies, completion, cancellation, and display/results for conflicts, errors, and retries.

ChatGPT authentication, access control for other accounts, and infrastructure-only tests are out of scope. Do not require another account or isolation test; CSP validation and infrastructure fault injection are also not completion criteria. Earlier user-separation conditions and remaining work in this document do not apply to Work verification.

See the [scope-updated verification report](../../note/note-20261001-work-m0-sites-proof.md). Basic current M0 round trip is confirmed, BUG-01/02 are defects, and Defer etc. are unimplemented. Unknown-result display, input preservation, and retry in Work remain unverified. Do not substitute local tests for Work measurements. Record verification results in the report and commit after the run; the report update alone does not mean every feature passed.

## Design Update After Work Measurements

Current contract is in [implementation](implementation.md) and updated architecture-plan.json. G1 M0 basic path passed; G2 infrastructure-only and cost checks were excluded; G3 MVP features, BUG regressions, and unknown-result behavior in Work were unverified at that point. FR15 is a technical requirement tracing BUG-02 to existing input-preservation requirements. Replace the old Firestore validation table's technical platform/completion criteria with current design. Preserve S01–S16 and C1–C4.

Checks performed at that time covered document structure, requirement/scenario traceability, dependency DAG, and local links. Do not state independent review, code tests, or live Work testing was completed.

## Local Implementation-Candidate Verification

Added an [implementation record](../../note/note-20261001-structured-todo-implementation.md). Checked 18 Node SQLite/virtual-clock tests and 4 jsdom UI tests; local BUG-01/02 regressions passed. Typecheck, lint, build, and migration-schema consistency were checked. New code had not yet been retested in live Work or deployed to Sites; D1 migration and full MVP acceptance were also not yet done. Do not infer new-code acceptance from earlier Work M0 evidence.

## MVP Acceptance Updated to Reflect Product Direction (2026-10-02)

Current acceptance comprises seven flows and 22 scenarios. Added PR01–PR07 from [requirements](requirements.md) and S17–S22 from [UX](ux.md). Preserve the preceding 16-scenario table and historical check JSON as evidence for their old version; do not reinterpret them as passes for the new conditions.

| Scenario | Assistance requirement | Observation and evidence | Status at the time |
| --- | --- | --- | --- |
| S17 | PR01, PR02 | Original capture, response preserving uncertainty, final state with no new task/deadline, whether unnecessary questions were asked | Unverified |
| S18 | PR02, PR03 | State after UI correction, read/change sequence in another conversation, same ID/correction/no duplicate | Unverified |
| S19 | PR04 | Original text/notes, unchanged Due/Defer, response does not create commitment from reference | Unverified |
| S20 | PR05 | Retrieved snapshot, candidates and reasons, distinction from all items, normal list unchanged | Unverified |
| S21 | PR02, PR06 | User intent, necessary clarification, appropriate saved/retrieved cancelled or deferred state | Unverified |
| S22 | PR07 | Actual host capability, response, receipt and retrieval, no promise of unsupported notification | Unverified |

Run each scenario in Work using fictional data across conversation, dedicated UI, and saved state. Record fixed source/prompt version, model (where available), schema, time, initial snapshot, tool calls, final snapshot, response, and pass/defect/unverified. Do not count a manually replayed conversation or local mock response as real-host acceptance.

Distinguish state/operations, assistance behavior, and long-term user benefit. Completion criteria here are passing in-scope operations and assistance behavior. Measure management/explanation/check/correction/monitoring burden, omissions, and user confidence in later longitudinal use. Duration, sample size, and success thresholds are undecided; do not record benefits as proven.

For this documentation update, check JSON structure, unique IDs, flow/scenario mapping, Given/When/Then/counterexample for added scenarios, and local links. Do not claim that existing dev-docs lint or live Work tests were rerun at that point.

## Implementation Progress on 2026-10-02

Added an [implementation/deployment restart record](../../note/note-20261002-benefit-mvp-progress.md). Implemented MCP delivery of assistance instructions and cancellation; 21 storage/core checks, 5 UI checks, typecheck, lint, and build passed. The changes had not yet been deployed to Sites and S17–S22 had not yet been accepted on the real host at that point. Existing version 3 deployment success and schemaVersion 2 D1 read were confirmed. Distinguish historical “not deployed” wording from the then-current new changes.

## Work Acceptance State at 2026-10-02 23:56 JST

The unverified table above is the initial state. Latest measurement is the [Work acceptance record](../../note/note-20261002-work-benefit-acceptance.md). S17/S18/S19 passed in Work. S20 was partially checked; explicit cancellation passed for S21 but ambiguity branch was not accepted; S22 recorded an initially insufficient explanation and a normal response in a separate conversation. Sidebar failed initially, then full-screen UI launched after reopening. Verdict for full completion, including S01–S16 regressions against deployed version, was still pending.

# Continuation Evidence from 2026-10-02

New implementation and UI resource URI were deployed to the existing personal-only Site. Final Sites source `4cf3abe5ce38cde9ba25457420ed9d6f76f28f86`, deployment `appgdep_6abf2114bcc48191b126aa345ed40ea1`, succeeded. Codex connection verified independent retrieval of pending capture, identical retry, rejection of different input, and Defer clearing by real time. Old screen in Codex MCP App showed list version 36 and a task created from conversation. New screen/tool definition awaited connection refresh. Details: [continuation report](../../note/note-20261002-benefit-mvp-progress.md) and [evidence](../../evidence/20261002-benefit-live.json). Full Work acceptance and long-term benefit remained unverified.

## Final Verdict on 2026-10-03

In-scope MVP acceptance completed. S01–S22, BUG-01/02, result lookup/identical retry, real-clock Defer clearing, and sidebar UI are linked to the final update in the [Work acceptance record](../../note/note-20261002-work-benefit-acceptance.md). Earlier unverified/failure statements are historical. Long-term benefits require separate evaluation.

Final Sites source `8f894c54db538a7f0b3974616f6a31f63da788f2`, deployment `appgdep_6abfd1e672888191900a671a02858c15`, succeeded. Assistance instructions are delivered in addition to initialize through the latest snapshot; list IDs are returned separately for normal/deferred/completed/cancelled. Post-fix Work confirmed clarification of ambiguous cancellation with no save change, distinction of all 14 normal items including dependency waiting, and initial explanation of unsupported notifications. Parent completion rejection identifies the incomplete child.

22 storage/core checks, 5 UI checks, typecheck, lint, build, and consistency checks on saved measurement snapshots passed. Response-loss behavior used an explicitly enabled client fixture; this is not a real network outage or infrastructure-failure test. Separate-account, infrastructure-only, CSP, and cost checks are out of scope.
