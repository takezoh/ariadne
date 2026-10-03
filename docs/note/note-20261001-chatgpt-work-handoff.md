---
id: note-20261001-chatgpt-work-handoff
kind: note
title: MVP Verification Handoff to ChatGPT Work
status: draft
created: '2026-10-01'
tags: []
owners: []
relations: []
source_paths: []
summary: Self-contained handoff to verify the minimum path for a dedicated in-ChatGPT UI, conversation operations, and persistent storage in Work.
---

# Handoff to ChatGPT Work

Pass this document to ChatGPT Work and start with the “Starting Instruction” below. The first verification can begin with this document alone, even if the repository cannot be opened. Proceed in English.

## Starting Instruction

> Ariadne's MVP is a structured ToDo with Defer that can be operated through a dedicated UI inside ChatGPT. First, verify in ChatGPT Work whether it can work using only the storage and execution platform provided by ChatGPT, without operating custom AWS/GCP infrastructure. Check the official tools and Skills available, then use fictional personal data to test: “Open the dedicated UI → save a ToDo → update the same ToDo in a conversation → retrieve it in the UI → retrieve it in a separate conversation.” Sites + D1 and a dedicated UI on a Page are candidates, not adopted decisions. A conversation message or Page checklist alone, and a website in a separate tab, do not pass. Record successes, failures, and unverified items with measured evidence. Do not use existing personal data, and keep sharing personal. After the minimum path works, verify Defer, parent-child relationships, dependencies, conflicts, and user separation below.

## Purpose and Required Scope

Structure needed ToDos, Defer items that are not needed now, and make them visible in a list again at the appropriate date and time. MVP requirements:

- Natural-language input, parent-child and dependency relationships, optional due dates, and date-time Defer.
- A dedicated UI inside ChatGPT with normal/deferred/completed lists, details, add/edit/complete/reopen/Defer/clear/cancel/update actions.
- Conversations and the UI operate on the same persistent state. It can be retrieved in a separate conversation.
- Distinguish successful save, unsaved, unknown result, and update conflict. Isolate data by user.

Calendar sync in general, time blocking, recurrence, active notifications, automatic observation of external conditions, and independent service-side LLM inference are out of scope. Defer resumption is guaranteed when the list is retrieved after the date/time; notifications to a closed screen and second-by-second automatic refresh are not required. Show the refresh action and retrieval time.

## Agreed Rules That Must Not Change

| ID | Agreed behavior |
| --- | --- |
| C1 | A parent's Defer also applies to descendants and hides them from the normal list. Do not overwrite a child's individual Defer date. |
| C2 | A parent with incomplete descendants cannot be completed. Even after all children are complete, the parent is completed manually by the user. |
| C3 | Before saving a date-only Defer, display 09:00 in the configured IANA time zone. Changing the setting does not move the resumption instant. |
| C4 | Unless explicitly deferred, dependency-waiting items remain in the normal list with a reason. Resolving a dependency alone does not clear Defer. |

Defer is distinct from changing a due date, completing, or deleting. A completed task does not reopen merely because its Defer date arrives. Reject self-referential or cyclic parent-child and dependency relationships. Reopen, cancel, or correction must not silently roll back a newer change.

## Current State and Evidence

Application code and the MVP implementation have not started. Requirements and technical design have been recorded. Cloud Run + Firestore, TypeScript/Node, and a React MCP Apps UI are existing design proposals, but the latest instruction is to first verify an approach that works entirely on the platform provided by ChatGPT. Do not resume infrastructure implementation from the earlier proposal.

From Codex, a [private verification Page](https://chatgpt.com/space/page_19afc26c57f08191b4ffd463c17f4aab) with fictional data was created using the Pages plugin.

| Verification | Measured result |
| --- | --- |
| Independent reload after creation | Retrieved parent-child checklist, Defer date/time, and due date |
| Rename child | Saved and confirmed after reload (sequence 1) |
| Change same block using stale hash | Rejected as edit_conflict / not_committed / rejected. Latest content preserved |
| Complete parent with incomplete child | Accepted (sequence 2). Page itself does not enforce C2 |
| Restore the completed parent | Returned to incomplete and confirmed after reload (sequence 3) |
| List Sites | Succeeded; 0 existing Sites. No Site was created |

These are preliminary checks of storage functionality, not evidence of a dedicated UI inside Work, retrieval in a separate conversation, Defer resumption, or atomic updates of the full graph. Codex had a Sites tool but no Sites build/deployment Skill matching the documented workflow. Do not assume Work has the same gap; check the Skills and features available in Work.

## Candidates and Open Questions

- **Sites + D1**: Official specifications describe an execution environment and persistent structured database. Candidate for avoiding custom cloud operations. However, the existence of Sites alone does not prove a dedicated UI inside ChatGPT or a conversation update path.
- **Dedicated UI on a Page + state storage**: Check this if the relevant feature is available in Work. A native checklist alone is insufficient. Measure whether UI state persists after reopening and in another conversation, whether a conversation can read and update the same source of truth, and whether C1–C4 can be enforced.
- **Artifact/Library files**: Do not adopt file storage alone as an updateable database, conflict-control mechanism, or shared source of truth for conversation and UI.

“ChatGPT only” means using hosting and storage provided by ChatGPT without operating custom GCP/AWS. Whether an additional Plugin/MCP/Skill is needed or registered, and account/plan requirements, are not yet settled. If something additional is required, report the product-required configuration separately from what is available in this account.

## Verification Order and Pass Criteria

### Initial Minimum Path

1. Check the official Skills and tools available in Work. Follow the matching procedure to create one private verification artifact. Do not create duplicate artifacts when the result is unknown.
2. Open the dedicated UI inside ChatGPT. Record where it appears, artifact URL/ID, client, and date/time. If it is only an external site, this item fails.
3. Create a fictional task in the UI. Close and reopen it, and confirm the saved content remains. Explain where the source of truth is stored.
4. Rename the same task in a conversation and confirm the change in the UI after refresh. Also change it in the UI and confirm the conversation retrieves that change.
5. Open the same artifact from a new Work conversation and retrieve the saved task without relying on copied conversation history.

If these pass, proceed with the platform candidate for UI, conversation, and persistent storage. If a step fails, identify which boundary—display, storage, conversation read/write, or permissions—does not work and compare alternatives. Passing this path alone does not mean the full MVP passes.

### Behavior and Consistency

Use fictional parent P, children A/B, and independent task D. Read initial values and results before and after each test.

| Test | Pass criteria |
| --- | --- |
| Defer boundary | Defer D for a few minutes. A retrieval immediately before the time omits it from the normal list and shows its date/time in the deferred list. After the time, refresh returns it with the same due date |
| Parent and child Defer | Set B's individual Defer later than parent P's. Deferring P hides its descendants; after P resumes, B alone remains deferred |
| Parent completion | Reject completion of P while A is incomplete. Even when all children are complete, P remains incomplete until manually completed |
| Date and time zone | Display a date-only selection in advance as 09:00 Asia/Tokyo. A time-zone setting change after save leaves the resumption instant unchanged |
| Dependencies and cycles | Show dependency-waiting reason in the normal list. Preserve individual Defer after prerequisite completion. Reject parent-child and dependency cycles |
| Complete/reopen/clear | Do not reopen a completed task just because its time arrives. Reopening by the user returns it to the list determined by its original Defer date. A parent-originated Defer is cleared through the parent's action |
| Conflict/cancel | An update or cancellation from stale state does not overwrite the latest correction. The reason and latest content can be inspected |
| Unknown result/retry | Do not claim success after a communication failure. Retry without duplicating the same addition or losing the original input |
| User separation | Reject another user's list and read/update by a known ID. Do not treat private artifact visibility alone as proof of data isolation |

Distinguish evidence from waiting on the real clock from local tests using a virtual clock. If a separate-user test cannot be performed, record it as unverified. Full MVP acceptance also includes S01–S16 in the linked UX.

## Deliverables from the Handoff

- A diagram or short explanation of the candidate architecture: in-ChatGPT display location, UI, conversation operations path, source of truth, user identity, and update control.
- Success/failure/unverified result for each test, operations, initial and retrieved values, artifact URL/ID, date/time, and target client. Exclude secrets and authentication tokens.
- What works with ChatGPT alone, what requires an additional Plugin or external platform, and the smallest next step.
- If a required Skill/feature is unavailable, provide its specific name and the environment checked. Do not confuse missing documentation with proof that a product feature does not exist.

## Documents to Read

If the repository is available, read in this order. Prioritize the latest dedicated-UI requirement and preliminary-verification direction over platform selection.

1. [MVP requirements in the development guide](../development.md#mvp-requirements) (the dedicated-UI requirement from the removed initial plan was carried forward)
2. [Agreed requirements](../changes/change-20261001-structured-todo-mvp/requirements.md)
3. [UX and S01–S16](../changes/change-20261001-structured-todo-mvp/ux.md)
4. [Preliminary verification record](note-20261001-chatgpt-only-feasibility.md)
5. [Existing technical proposal](../changes/change-20261001-structured-todo-mvp/implementation.md) and [acceptance plan](../changes/change-20261001-structured-todo-mvp/verification.md)

Official documentation (checked as of 2026-10-01; check the latest support when running the procedure):

- [Plugins Quickstart](https://developers.openai.com/plugins/quickstart): connection test in Work. Dedicated UI is outside the Quickstart scope.
- [Connect and test your plugin](https://developers.openai.com/plugins/deploy/connect-chatgpt): test both dedicated UI and model-facing results.
- [Plugins](https://learn.chatgpt.com/docs/plugins): Work/Codex environments and account requirements.
- [Sites](https://learn.chatgpt.com/docs/sites): D1/R2, execution environment, and publication scope. Connection to an in-ChatGPT UI must be verified separately.

## Measured Update in Work (2026-10-01 19:56 JST)

Added the [Work M0 deployment and verification record](note-20261001-work-m0-sites-proof.md). Deployed a private Sites + D1 + MCP Apps UI verification version and confirmed MCP recognition, real D1 table creation, and 10 local checks passing. Experimental code is saved in the Sites source; it has not been integrated into the main MVP. Installation/connection of the personal plugin **Ariadne · Work Verification** is pending, so the dedicated UI inside ChatGPT, save round trip, and retrieval in another conversation are still unverified. To continue, follow the connection steps in the new record rather than creating the same Site again. The agreed requirements and C1–C4 remain unchanged.

## Update from Live Work Verification (2026-10-01 21:29 JST)

The connection pending at 19:56 was resolved. Email sign-in and MFA were completed, and the personal plugin was connected. Adding through the dedicated UI inside a Work conversation, restoration after closing a tab, conversation-to-UI update, UI-to-conversation retrieval, and restoration in a separate Work conversation without copying history all succeeded. An independent read from production D1 confirmed the same ID and revision.

Use the [updated measured record](note-20261001-work-m0-sites-proof.md) and [operation/result JSON](evidence/work-m0-live-20261001.json) as the source of truth. The minimum connection path passes, but BUG-01—accepting different input under the same rename request ID—and BUG-02—losing an unsaved proposal after an update conflict—were reproduced in the live system. Defer, parent-child, dependencies, completion, and cancellation are not implemented in current M0, so the overall MVP fails. Cross-account separation, real host communication loss, and CSP enforced-on behavior remain unverified. Do not conflate synthetic IDs or locally injected failures with real-world tests or claim that nothing remains unverified.

When continuing, do not reinstall or create a new Site; start with reproducing the defects in the measured record and the next smallest work item. The deployment code remains at commit c3171a04f3dab9970175a4f2866713b84e7038e7. Preserve two fictional tasks as evidence and keep sharing personal-only.

## Finalize the Scope of This Verification (2026-10-01 22:42 JST)

Follow the user's instructions from 22:29–22:42 JST: limit this verification to display, operation, and saved results in ChatGPT Work. In scope are the dedicated UI; saving, restoring, and retrieving in another Work conversation; mutual updates between UI and conversation; Defer, parent-child, dependencies, completion, and cancellation; and conflict, error, and retry behavior during operations.

Authentication by ChatGPT and access control across other accounts, as well as infrastructure-only tests, are out of scope. Do not require another account or a separation test, and do not include CSP validation or infrastructure fault injection in this verification's completion criteria. User-separation acceptance criteria and remaining work mentioned earlier in this document or table do not apply to this Work verification.

See the [scope-updated verification report](note-20261001-work-m0-sites-proof.md). The basic round trip in current M0 is confirmed, BUG-01/BUG-02 are defects, and Defer and other behavior are not implemented. Display, preservation of input, and retry when the result is unknown in Work remain unverified. Do not substitute local testing for a Work measurement. Update the report and commit after verification completes. Updating this report now does not mean all features have been verified.
