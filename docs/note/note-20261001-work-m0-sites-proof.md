---
id: note-20261001-work-m0-sites-proof
kind: note
title: Work M0 Measurements — In-ChatGPT UI Round Trip Passed; MVP Incomplete
status: draft
created: '2026-10-01'
summary: After email authentication and personal plugin connection, measured saving in the Work UI, bidirectional updates with conversation, and retrieval in a separate conversation. Two defects found in negative tests. Full MVP not achieved.
---

# Verdict

Measurements through 2026-10-01 21:29 JST show that **dedicated UI inside ChatGPT Work → save → close and reopen → update in conversation → retrieve in UI → update in UI → retrieve in conversation → restore in another Work conversation** succeeded. Sites-managed D1 is the source of truth, and UI, conversation, and independent D1 reads agreed. No custom AWS/GCP operations were added.

**The M0 basic connection path passes; the full MVP fails.** Two defects were measured: reuse of a change request ID with different input and loss of unsaved input after a conflict. Defer, parent-child, dependencies, completion, and cancellation are not implemented in the current version and do not meet required features. Display after a Work communication loss/timeout remains unverified. At the user's direction at 22:37 JST, ChatGPT authentication/access control across other accounts and infrastructure-only tests are out of scope.

Formal replacement of the Cloud Run + Firestore proposal, passing the full MVP, and integration into main application code remain undecided. Requirements and C1–C4 are unchanged.

## Verification Scope (Finalized 2026-10-01 22:42 JST)

At the user's direction, verify display, operation, and saved results in ChatGPT Work.

- In scope: dedicated UI, saving and restoring, retrieval in another Work conversation, mutual reflection between UI and conversation, Defer, parent-child relationships, dependencies, completion, cancellation, and display/results for conflicts, errors, and retries during Work operations.
- Out of scope: ChatGPT authentication/access control across other accounts, separation testing with another account, infrastructure-only tests/fault injection/cost evaluation, and testing ChatGPT security settings themselves.
- Verdicts: measured Work results are confirmed or defects. Features with no available operation are unimplemented. Mark only in-scope behavior not yet measured as unverified.
- Preserve existing infrastructure/local test records as supplemental material; do not count them as Work passes or remaining Work-unverified items.

This report covers tests of current M0. It does not show that all target features have been verified. Append and commit additional verification results to this report.

## Environment and Saved Artifacts

- Client: desktop web ChatGPT in cloud Chrome, **Work mode**. Email sign-in and MFA completed.
- Installed and connected the personal plugin **Ariadne · Work Verification**. Confirmed the connected state and called tools from Work.
- [Work conversation with round-trip, retry, and negative tests](https://chatgpt.com/c/6abe4f30-5b4c-83e8-83fe-ddf0e6b1714a)
- [Separate Work conversation restored without copied history](https://chatgpt.com/c/6abe501d-5528-83e8-90ba-af5c03afe6d4)
- Verification version: https://Ariadne-work-proof.take-gn.chatgpt.site
- MCP: https://Ariadne-work-proof.take-gn.chatgpt.site/mcp
- Site project: `appgprj_6abe391bc8cc81918b4e842b4db293e8`
- Version: `appgprj_6abe391bc8cc81918b4e842b4db293e8~appgver_943a61393c5481919f8feb645627b376`
- Deployment: `appgdep_6abe3c1c9fa4819186c41330d0768b0f`, `succeeded` / `has_mcp=true`
- Sites source commit: `c3171a04f3dab9970175a4f2866713b84e7038e7`. Deployment code was not changed for this live test.
- Plugin ID: `plugin_asdk_app_sites_b9cfa73bf234819184881924e7d5e92a`
- Publication scope: confirmed with get_site as custom, one owner, and no additional users, groups, or external viewers. Sharing was not changed.
- Two fictional tasks only. Existing personal ToDos, calendar, and business data were not used.
- Host display said “CSP off.” Read that “Enforce CSP for custom apps” was off. Did not change settings; this is not a pass with CSP enforced.
- The earlier note that the browser was untested because no control-browser Skill was available was resolved using available CUA browser control. Do not treat missing documentation as proof that a product feature does not exist.

## Implementation Boundary

ChatGPT Work MCP Apps UI/conversation → Sites `POST /mcp` → shared `taskCall` → D1 `DB.tasks`.

The UI uses `ui://action-tools/tasks-v1.html`, `text/html;profile=mcp-app`, `_meta.ui.resourceUri`, and the standard MCP Apps bridge. Operated the embedded screen directly inside a Work conversation, not only an external site. localStorage is not the source of truth.

Only four tools are available:

| Tool | Current operation |
| --- | --- |
| ariadne_open | Dedicated UI and saved list |
| ariadne_list_tasks | Independent list retrieval |
| ariadne_add_task | Add fictional task and retry addition with identical input |
| ariadne_rename_task | Rename using expected_revision |

All reads and writes are owner-scoped using the server-side authentication ID. Service credentials are not treated as user IDs, and authentication headers were not spoofed. The storage table has owner/id/title/initial_title/revision/last_request/created_at/updated_at; it has no Defer, graph, completion, or operation-history columns.

## Minimum Path Measurements

Shared task ID: `3ddd2e2a-0d4f-42b5-86a7-67a383e2ad70`. Times are JST.

| Operation | Retrieved result | Verdict |
| --- | --- | --- |
| 21:17:11, ariadne_open in Work | Ariadne screen in the conversation, add/update/save actions, empty list | Pass |
| 21:17:37, add in UI | “Verification only: check fictional travel packing list,” revision 1. Independent production D1 read agreed | Pass |
| Close tab and reopen same conversation in new tab | At 21:18:04, same ID/title/revision 1 | Pass |
| List and rename in conversation, refresh UI | At 21:19:00, “Verification only: changed packing check from conversation,” revision 2 | Pass |
| Correct title in UI, list from conversation | At 21:19:19, “Verification only: corrected packing check from UI,” revision 3. Production D1 agreed | Pass |
| List/open in new Work conversation | At 21:21:18, same ID/title/revision 3. Prompt did not include old title, ID, revision, or conversation history | Pass |

Screenshot of new conversation: `Ariadne-work-new-chat-20261001.jpg`. Structured measurement record: [work-m0-live-20261001.json](evidence/work-m0-live-20261001.json).

## Retry and Conflict Measurements

Retry-test task ID: `ae9cd678-7383-4a06-90f2-e1b9f69b36e0`.

| Test | Observation | Verdict |
| --- | --- | --- |
| Send identical add request twice | Same ID/revision 1. One existing + one new task, still two total | Pass, live MCP/D1 |
| Reuse same add ID with a different title | Rejected with idempotency_conflict | Pass, live MCP/D1 |
| Repeat same rename arguments | Remained at revision 2 | Pass, live MCP/D1 |
| Retry original add after rename | Preserved renamed title and revision 2 | Pass, live MCP/D1 |
| Save revision 4 in one UI, update from revision 3 in another | Conflict shown. D1 preserved latest title/revision 4. Input proposal remained immediately after rejection | Pass, live UI/D1 |
| Reuse same rename request ID with different content and next revision | **Accepted and advanced to revision 3** | **Fail, BUG-01** |
| Press refresh after a UI conflict | Retrieved latest state at 21:27:49 and replaced input with saved title. No preservation/comparison of unsaved proposal | **Fail, BUG-02** |

### BUG-01: Rename Request ID Reused with Different Input

1. Changed to “Verification only: after idempotency change” with `request_id=44774580-c9a7-41b0-9e70-a3a304773d57` and expected_revision 1. It became revision 2. An immediate identical retry remained at revision 2.
2. Reused the same request_id with expected_revision 2 and title “Verification only: different correction using the same request ID”; sent once.
3. It was accepted at 21:27:06.585 and became revision 3. Conversation reread, another UI refresh, and independent D1 read agreed. Reproduced locally as well.

The current last_request-only check cannot preserve the mapping between request ID and input. Success for ordinary identical retries is not enough to pass idempotency overall.

### BUG-02: Refresh After Conflict Loses Unsaved Correction

1. In one UI, saved “Verification only: keep latest correction” for the shared task at revision 5.
2. In another UI still on revision 4, entered “Verification only: unsaved correction to preserve” and saved. It conflicted, but the input remained at that point.
3. As instructed, pressed “Refresh.” At 21:27:49 it retrieved revision 5 and replaced the input field with the saved title. The unsaved proposal was not preserved or shown for comparison.

Screenshots: `Ariadne-conflict-20261001.jpg` and `Ariadne-refresh-draft-loss-20261001.jpg`. Protecting saved content succeeded, but the experience contract to preserve unsaved input was not met.

## Verdict on Remaining Required Items

Absence of an implementation counts as a missing required feature. Do not report an unavailable operation as performed or passed.

| Target | Current-version verdict and rationale |
| --- | --- |
| S01 Natural-language input, references, and structuring | Not met. Only title addition exists; no separation of original input from structured results or relationship storage |
| S02 Unorganized input and retry | Not met. Identical add retry passed, but no unorganized-input model |
| S03–S04 Parent-child correction, self-reference, and cycles | Not met. No parent-child/dependency operations or storage fields |
| S05–S09 Defer boundary, C1/C3, parent-originated clear, and deadlines | Not met. No Defer, time-zone setting, due date, or normal/deferred views. Do not claim real-clock boundary testing |
| S10–S11 C4, dependencies, waiting on others, and prerequisite reopening | Not met. No dependency, waiting, or reopen operations |
| S12–S13 C2, parent completion, complete/reopen while deferred | Not met. No completion/reopen operation |
| S14 Cancellation conflict | Not met. Cancellation itself is absent |
| S15 Separate conversation, concurrent editing, and user isolation | Separate-conversation restoration and stale-revision rejection passed live. Unsaved-input preservation is BUG-02. User-isolation verification is out of scope |
| S16 Permission escalation, unknown result, and retry | Identical add retry passed in Work. Rename request ID is BUG-01. Display/input preservation during Work network loss/timeout is unverified. Access control and infrastructure-only fault injection are out of scope |

## Distinguishing Local and Live Tests

The prior 10 local checks, TypeScript, UI JavaScript syntax, build, private deployment, and D1 schema creation succeeded. The local HTTP preview reachability issue was not used as a substitute for the Work live test; the production M0 path itself was checked. External reference pages and WebMCP were not used as the passing route for in-ChatGPT UI.

The [additional test script](evidence/work-m0-adversarial-check.mjs) at 21:26:01 called deployed source code through a Node SQLite adapter matching D1 shape.

- Deliberately failed the read after a write; confirmed one saved item despite the unknown result and no duplicate after retrying the same add.
- Rejected list access and update by known ID from synthetic user B when scoped to A. Also rejected attempts to set owner through arguments and missing authenticated ID/email.
- Ran concurrent edits with different titles from the same revision; observed one success, one conflict, and final revision 2.
- Reproduced BUG-01.
- Unsupported Defer/parent-child/dependency/complete/reopen/undo operations returned unknown_tool. Compared against the four currently published tools and storage schema.

These are not production network-loss tests or tests with two actually authenticated users.

## Remaining Unverified or Unimplemented Items in Work

- **Unknown-result display and retry**: Unverified whether the Work UI displays an unknown result and retains input on network loss/20-second timeout. Ordinary retry with the same request was confirmed in Work. Do not substitute local fault injection for a pass here.
- **Defer, parent-child, dependencies, completion/reopening, cancellation, etc.**: Not implemented in current M0. Record them as unimplemented, separately from unverified, using the S01–S16 table above.
- **Post-fix regression verification**: BUG-01/BUG-02 are not fixed yet; no post-fix Work verification has been performed.

Cross-account isolation, CSP settings, and infrastructure-only tests were removed from the current unverified list. Keep past observations as history.

## Smallest Next Steps

1. Implement storage contract preserving request ID/input mapping and add a negative regression test for BUG-01.
2. Preserve the proposed correction alongside the latest state after conflict and fix BUG-02.
3. Implement Defer, parent-child, dependencies, completion, and cancellation on the same Site/auth boundary, then verify C1–C4 and S01–S16 using the real clock/UI.
4. Measure unknown-result display, input retention, and retry in the Work UI. Do not add ChatGPT access-control or infrastructure-only tests to this round's completion criteria.

## Official References Consulted (2026-10-01)

- https://developers.openai.com/plugins/build/chatgpt-ui
- https://developers.openai.com/plugins/build/app-quickstart
- https://learn.chatgpt.com/docs/sites
- Sites building/hosting/mcp/auth/persistence Skills available in that Work environment

Distinguish the existence of official specifications, availability in the account, and results actually measured here.
