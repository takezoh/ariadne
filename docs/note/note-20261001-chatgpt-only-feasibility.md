---
id: note-20261001-chatgpt-only-feasibility
kind: note
title: Feasibility of a ToDo persistence and execution platform entirely inside ChatGPT
status: draft
created: '2026-10-01'
tags: []
owners: []
relations: []
source_paths: []
summary: Measured save/read/update-conflict behavior with Pages. Sites + D1 is an official-spec candidate, but runtime verification was incomplete.
---

## Conclusion

ToDo persistence inside a ChatGPT account was measured using Pages. A simple version that organizes a list in conversation works. It was not established that Pages alone can guarantee all agreed MVP behavior: read-time Defer projection, parent-child/dependency invariants, atomic updates and a dedicated UI. Sites + D1 is an officially documented candidate for a dedicated app without self-managed external cloud. Deployment and DB persistence for a real app were unverified; this decision did not yet supersede Cloud Run + Firestore.

## Measurements (2026-10-01)

Created a private Page with no real data through the Pages Plugin. Did not change existing Pages or sharing settings.

Test target: [Ariadne ToDo persistence check](https://chatgpt.com/space/page_19afc26c57f08191b4ffd463c17f4aab)

| Operation | Observed result | Limit |
| --- | --- | --- |
| Create, then retrieve with a separate `read_page` | Parent-child checklist, defer date and deadline persisted | Resumption across sessions not measured |
| Update child task title with `patch_page` | Applied at sequence 1 and confirmed by reread | Transaction across the full graph not verified |
| Update the same block using a stale hash | Returned `edit_conflict`, `not_committed`, `rejected`; retained latest title | Block-level conflict rejection; multiple ID-based operations could partially succeed |
| Complete a parent while its child is incomplete | Accepted at sequence 2; reread showed completed parent and incomplete child | Page itself does not enforce the MVP rule preventing parent completion |
| Restore the parent above | Returned to incomplete at sequence 3 and confirmed by reread | Test data was restored to the correct initial state |
| List Sites | Succeeded; no existing Site found | No create/build/deploy or D1 persistence performed |

The Page stored Defer as text. We did not test automatic redisplay when time arrives, dependency-cycle rejection, time-zone conversion, operations from another conversation or browser UI interaction. Do not treat this success as MVP acceptance.

## Approach comparison

- **Pages + conversation**: Measured persistence and updates inside ChatGPT. Candidate for starting a personal trial without custom cloud. Rules must be enforced by the Skill/conversation and can be bypassed by directly editing a Page. Read-time date evaluation and list reconstruction require more verification.
- **Sites + D1**: Official material describes D1 for persistent structured data, R2 for files and a hosted runtime. Managing parent-child/dependencies in tables and calculating Defer display at read time is technically reasonable, but was not demonstrated in this environment.
- **Artifact / Library file**: Do not treat file storage/download as an updateable app database or conflict control. A safe API to replace an existing file and app integration were unverified.

“ChatGPT only” here means using ChatGPT-provided persistence/hosting without operating custom GCP/AWS. A Web app on Sites and a Plugin operated from conversation over MCP are separate connection contracts; it was not established that Sites provides MCP connectivity automatically.

## Verification limits and next decision gate

The Sites tool was available, but the local implementation, source-preparation and deployment Skill required by its description was absent from the available Skills and local cache. We did not guess the deployment procedure without that Skill. No Site was registered or published.

The next real-world checks on a private Site are: (1) D1 save/read, (2) list return at the Defer boundary, (3) reject completing a parent with incomplete children, (4) reject stale-revision updates, and (5) operate on the same source of truth from conversation. Do not consider an in-ChatGPT dedicated MVP verified until these pass.

## Sources

- [Official Sites documentation](https://learn.chatgpt.com/docs/sites): D1/R2, access control and supported runtime. Checked 2026-10-01.
- [Official Plugin UI documentation](https://developers.openai.com/plugins/build/chatgpt-ui): distinguishes widgetState from persistent business state.
- Actual `create_page` / `read_page` / `patch_page` responses from the Pages Plugin. Recorded sequences and conflict code above. Personal account IDs and credentials are not recorded.

## Requirement clarification after verification

A dedicated UI inside ChatGPT is also required for MVP. “The simple version works” above describes a limited observation of persistence and conversation updates, not a working MVP. Do not finalize Sites + D1 adoption until both UI delivery inside ChatGPT and conversation operations on the same source of truth are demonstrated. A site in a separate tab alone does not meet the requirement.
