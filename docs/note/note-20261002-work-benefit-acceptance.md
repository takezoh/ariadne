---
id: note-20261002-work-benefit-acceptance
kind: note
title: Benefit-Led MVP Acceptance in Work
status: published
created: '2026-10-02'
tags: []
owners: []
relations: []
source_paths: []
summary: Real-host acceptance results and failure history from testing started 2026-10-02 and after fixes on 2026-10-03.
updated: '2026-10-03'
---

# Work Benefit-Led MVP Acceptance (2026-10-02 23:45–23:56 JST)

Client: ChatGPT Work web, GPT-6.1 Sol Light. Sites source `1bce06ecab6e4774d84fa538b857969784d78d1b`, deployment `appgdep_6abfbb42c0748191bbe07f1b45854a6e`. Actual responses are in the work-transcript/work-sidebar-transcript evidence; the independently retrieved snapshot is work-benefit-live.json. Fictional data only.

| Acceptance item | Measured result |
| --- | --- |
| S17 | Passed. Saved garden cleanup as a pending capture. Explained that execution was undecided; did not create a due date or task. Revision 43; existing task count remained 12. |
| S18 | Passed. Corrected an existing verification task title in the Work UI and saved from the confirmation screen. Retrieved revision 47 and the corrected title for the same ID from a separate sidebar conversation. No new item or other save change. |
| S19 | Passed. Saved pot placement as one task. Preserved the preference “next week” and reference URL in notes. Due/Defer remained null. Did not create a separate URL-reading task. |
| S20 | Partially verified. Recommendation was “check packing list,” distinguished from the 10-item normal list, with reasons based on due date/prerequisite. No save for the recommendation. Did not run the Given where dependency-waiting items remain in the normal list. |
| S21 | Explicit cancellation passed. Saved the pot task as cancelled without claiming it was complete. Confirmed independently at revision 46. The clarification branch for ambiguous “stop for now” was not accepted yet. |
| S22 | Initial response was insufficient because it omitted how to update after arrival was reported. A follow-up explained the manual clear action. In a separate retest, the initial response explicitly stated that automatic detection/notifications are unavailable and that the user can report arrival to clear waiting; no saved state changed. Preserve the insufficient initial response in the record. |
| Sidebar | Initial launch showed App unavailable and Retry also failed. In-conversation UI launched normally. Opening the standalone URL in a new window started the full-screen UI and showed the latest list at revision 47. Recovery confirmed; cause of initial failure is unknown. |

This test added one task (pot placement, later cancelled) and two pending captures, and corrected the title of one earlier verification task. No other saved item changed. It demonstrated shared state between Work conversation and the dedicated UI and successful sidebar launch, but still lacked evidence reconciliation for S01–S16 against the deployed version, the complete S20 Given, the S21 ambiguity branch, and reproducibility of the initial S22 deficiency. Do not mark the full MVP complete at this point.

## Verdict After Regression Testing and Fixes on 2026-10-03

In-scope MVP acceptance completed. Used live conversations in ChatGPT Work web with GPT-6.1 Sol Light, the expanded in-conversation UI, and full-screen sidebar UI. Final Sites source: `8f894c54db538a7f0b3974616f6a31f63da788f2`; deployment `appgdep_6abfd1e672888191900a671a02858c15` succeeded at 2026-10-03 00:48:50 JST. Publication remained personal-only. Preserved existing migrations 0000/0001; created no new Site/Plugin.

Before the fix, ambiguous “stop for now” became cancelled without a question, and cancelled items were counted in the normal list. Strengthening initialize instructions alone reproduced the issue in a new conversation. Changed saved-state reads to also return the latest assistance policy and per-list ID sets. A new Work conversation then asked whether the user meant temporary hold or cancellation; no state changed before the answer (still revision 64). Keep the original failure history; do not recast it as an initial pass.

Also fixed the missing child name in the reason for rejecting parent completion. Final deployment showed: “Incomplete child task: Verification 0301: Decide on the layout. Review it first.” Revision 86 remained unchanged.

| Scenario | In-scope measured result |
| --- | --- |
| S01 | Saved original input, parent-child, and dependency from natural-language input in Work. Reference URL remained only in the parent's notes. Revision 49. |
| S02 | Saved only the original input through UI, leaving no structured result; Work detected pending input and structured two tasks from it. Retry reused the same two tasks with no duplicates. This was a controlled test of interrupted semantic judgment, not an actual host failure. |
| S03 | Removing parent relationship preserved the same ID/content, due date 2026-10-06T09:00Z, individual Defer 2026-10-05T00:00Z, and dependency. Revisions 84–86. |
| S04 | UI rejected parent-child and dependency cycles; revision unchanged. |
| S05 | Retrieved before and after real time. Deferred before Defer time; returned to normal on UI refresh after the time, preserving parent due date 2026-10-03T09:00Z. |
| S06 | Resolved date-only Defer to 09:00 Asia/Tokyo. Changing setting to America/New_York preserved saved UTC instant. Restored setting to Asia/Tokyo. |
| S07 | Parent and non-deferred child returned to normal on retrieval after the real time; child with future individual Defer remained deferred. |
| S08 | Displayed child as deferred by parent and previewed scope for clearing parent's Defer. Another child with individual Defer remained deferred. |
| S09 | Previewed descendant effects and deadline risk before saving. Confirmed through preview that past dates do not hide items from the normal list. |
| S10 | User's future Defer remained after prerequisite completion cleared dependency waiting. Once Defer was cleared, dependency waiting remained visible in the normal list with a reason. |
| S11 | Reopening the prerequisite restored waiting reason for the incomplete dependent. User-reported arrival cleared only manual_wait; the task remained incomplete. |
| S12 | Rejected completion of a parent with incomplete child. Parent remained open after all children were complete, until user completed it. Final version showed child name in rejection reason. |
| S13 | Completed while deferred, then previewed original future Defer and reopening of completed ancestor before reopening. Another completed task stayed completed after real time; only explicit reopening showed its original past Defer and returned it to normal. |
| S14 | Rejected stale Undo when another screen had a newer correction and preserved latest title. Undo of non-conflicting Defer succeeded. |
| S15 | Retrieved the same D1 state across another Work conversation, in-conversation UI, and sidebar. Rejected a save from a stale revision. Separate-account testing was excluded as specified. |
| S16 | With an explicitly enabled client verification fixture, discarded one response after the real save completed. After 20 seconds, UI showed unknown result and retained input. Operation lookup and identical retry each recovered to one item. Retry after a later change did not increment revision 70 or duplicate. Prompt injection quote remained pending original input; no execution/task creation. This does not claim a real network interruption was reproduced. |
| S17 | Reused prior day's measurement of saving undecided input. No task creation or deadline inference. |
| S18 | Reused prior day's measurement that another Work conversation could retrieve a correction made through dedicated UI. This time also compared dirty draft and latest correction for same ID and saved after user confirmation. |
| S19 | Reused prior day's preservation of preferred date/URL in notes. This time a report-note URL also remained in notes; no Due/Defer inferred. |
| S20 | Work gave two candidates and reasons, then showed all 14 normal items separately. Included dependency waiting; excluded deferred/completed/cancelled. No save for recommendation. |
| S21 | In addition to prior day's explicit-cancellation measurement, post-fix “stop for now” prompted a clarification and left state unchanged. User's answer preserved intent that date was undecided and no change was needed. |
| S22 | Initial response explained that automatic detection/notifications are not provided and told user how to clear waiting after reporting arrival. Actual arrival input did not cause false completion. |
| BUG-01 | Supplied different input for existing operationId in Work and confirmed idempotency_conflict. Did not replace it with a new ID; preserved current title. |
| BUG-02 | Entered unsaved UI draft, then corrected the same ID through another path. Rejected stale save, preserved draft after refresh, and showed latest saved title/version for comparison. Saved after confirmation. |

Evidence: [measured snapshot](evidence/work-regression-20261003.json), [follow-up snapshot](evidence/work-regression-followup-20261003.json), [Work responses](../evidence/20261003-work-transcript.txt), [assistance-fix response](../evidence/20261003-policy-response.txt), [response recovery UI](../evidence/20261003-response-recovery.txt), and [final UI](../evidence/20261003-final-ui.txt). Check saved snapshot consistency with `node docs/note/evidence/verify-work-regression-20261003.mjs`. This checks the record; it does not rerun Work tests.

Final code passed 22 storage/core checks, 5 UI checks, typecheck, lint, and build. Mark the in-scope personal-use MVP with personal-only access complete. This verdict excludes long-term reduction in cognitive/management burden, general availability, pricing, calendars, automatic notifications, background execution, observation of external arrivals, and saved perspectives. Separate-account, infrastructure-only, CSP, and cost tests were out of scope at the user's direction. Preserve the historical observation that the sidebar initially showed App unavailable for an unknown reason. The existing sidebar UI remained operable during this test.
