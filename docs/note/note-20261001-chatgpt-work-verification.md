---
id: note-20261001-chatgpt-work-verification
kind: note
title: Platform Verification After the ChatGPT Work Handoff
status: draft
created: '2026-10-01'
tags: []
owners: []
relations: []
source_paths:
  - docs/note/note-20261001-chatgpt-work-handoff.md
  - docs/development.md
  - docs/changes/change-20261001-structured-todo-mvp/requirements.md
record_type: debug-experiment
subject_paths:
  - docs/note/note-20261001-chatgpt-work-handoff.md
change_ref: change-20261001-structured-todo-mvp
outcome: environment-blocked; MVP runtime behavior not verified
summary: Checked available tools and connection paths after receiving the handoff. No ChatGPT Pages/Sites operation path was exposed, so the minimum flow could not be run. This records an environment limitation, not lack of product support.
---

# Conclusion

**Received the handoff and performed the initial capability and connection-path check. The minimum path was `environment-blocked`; MVP behavior remains unverified.**

The tools callable from this conversation did not include operations for ChatGPT Pages/Sites. The published list of installed Skills also had no dedicated Sites create/build/deploy Skill. Additional searches did not reveal a relevant execution path. Therefore, no private verification app was created and no live measurement was made for saving from a dedicated UI, updating the same task from conversation, or restoring it in another conversation.

This is **an observation about this conversation's execution environment**. It does not establish that Pages/Sites are unavailable throughout ChatGPT Work, that the user's account is not eligible, or that Ariadne cannot be implemented on the platform provided by ChatGPT. Not running the app is not a failed product test.

**Preserve the requirement for a dedicated UI inside ChatGPT, C1–C4, and S01–S16. Do not switch to a Cloud Run + Firestore implementation and do not treat Sites + D1 as adopted.**

## 1. Target and Evidence Scope

- Date performed: 2026-10-01, Asia/Tokyo. Clock observation during review: 18:23:30 JST.
- `main` at time of read: `9f84aadaee6de2415ec0478156f4e5288706f722`, retrieved from GitHub `git/ref/heads/main`.
- Handoff source: [chatgpt-work-handoff](note-20261001-chatgpt-work-handoff.md). Blob SHA: `8aae44a3961813f36d99d7ffb2fc0f0511ee80f9`.
- Target environment: tools and Skills exposed from the ChatGPT conversation that received this request. Did not visually inspect Work mode selection, browser/app client, or workspace settings in the user's interface.
- Operator: assistant in this conversation. No independent review by a separate agent or execution in a separate conversation was performed.
- Refetched GitHub state and confirmed that the target repository was private and had write permission to main.

The initial plan discussed at that time has been removed. Its dedicated in-ChatGPT UI requirement was carried forward to the [development guide](../development.md#mvp-requirements). Other reviewed materials: [requirements](../changes/change-20261001-structured-todo-mvp/requirements.md), [UX](../changes/change-20261001-structured-todo-mvp/ux.md), [preliminary verification](note-20261001-chatgpt-only-feasibility.md), [technical design](../changes/change-20261001-structured-todo-mvp/implementation.md), and [acceptance plan](../changes/change-20261001-structured-todo-mvp/verification.md). Prioritized the instruction to verify an approach using ChatGPT's provided platform first. Organizing referenced material does not change what was observed at that time.

Repository documents were retrieved successfully, but this does not count as evidence that Ariadne business data was saved and restored. The preliminary verification Page was neither reloaded nor modified in this conversation.

## 2. Capability and Path Checks Performed

The following records tool-call results as needed. Personal account data and credentials from search results are excluded.

| Evidence ID | Operation | Observed result | Interpretation |
| --- | --- | --- | --- |
| E01 | Retrieved handoff note, plan, requirements, UX, existing design, and verification records from GitHub | Retrieval succeeded. Confirmed implementation had not started, a dedicated in-ChatGPT UI was mandatory, and the ChatGPT-only approach should be checked before external infrastructure | Read and requirements intake complete; not an app demonstration |
| E02 | Listed `skills://plugins` with `api_tool.list_resources` | Returned 33 Skill resources. No dedicated Pages/Sites implementation or deployment Skill | Observation of the list exposed to this conversation. A template-creator description that takes a Site as input is different from a Sites deployment Skill |
| E03 | Requested operation schemas for `Pages` and `Sites` with `api_tool.list_resources` | Returned `No tool was defined under the given paths.` Available namespaces included Composio, GitHub, Gmail, Google_Calendar, Google_Contacts, Google_Drive, LinkedIn, Plugin_Management, Slack, and files | Could not call a real Pages/Sites operation through this path. This was not an authorization failure after trying read_page or Site creation |
| E04 | Read Plugin Management Skill and ran `search_plugins(query="Pages Sites", limit=10)` | Returned Webflow, Wix, WordPress.com, etc., but no execution path for native ChatGPT Pages/Sites | Search is not exhaustive proof of nonexistence. Do not add external services that serve a different use |
| E05 | Read Composio Skill/hosted instructions and searched tools directly for native ChatGPT Sites/D1 and Space Pages | Sites search returned GitHub Pages/Cloudflare Pages; Pages search returned SharePoint/CustomGPT, etc. Not the relevant ChatGPT features | Do not use a different product. Do not substitute external deployment or connections as the verification target |
| E06 | Retrieved official OpenAI Sites, Plugins, MCP UI, and authentication documentation | Reconfirmed published specifications in §4 | Documentation check only; not live acceptance of this account, UI, storage, or authentication |

Summary of E03 request and response:

```json
{"paths":["Pages","Sites"]}
```

```text
No tool was defined under the given paths.
```

Do not paraphrase this result as “Sites does not exist” or “Work has the same restrictions as Codex.” An earlier Codex record successfully listed Sites, unlike the tool set exposed here.

## 3. Results for the Minimum Path

`blocked` means the required execution environment was unavailable; `not_run` means the operation was not attempted because its prerequisite was not met. Assign pass/fail only when actual results can be compared with expected app behavior.

| ID | Test specified in the handoff | Status this time | Result and gap |
| --- | --- | --- | --- |
| M0-01 | Check official Skills/tools and prepare one private verification artifact | blocked | Ran E02–E05. No matching creation/deployment/Page operation path was available; did not create an artifact |
| M0-02 | Open dedicated UI inside ChatGPT | not_run | No verification app, display tool, or measured evidence of its display location |
| M0-03 | Save fictional ToDo in UI, close and reopen | not_run | No task ID, source of truth, save result, or retrieved content |
| M0-04 | Update same ToDo in conversation and retrieve in UI, then reverse | not_run | No authenticated business operation connecting UI and conversation |
| M0-05 | Retrieve same source of truth from a new conversation | not_run | Do not substitute reload in this conversation or copied history. No path to start another conversation and operate the app was available |

No new Site/Page URL or ID, deployment ID, D1 binding, MCP endpoint, UI resource URI, saved task ID, or revision was **issued or retrieved**. Do not invent values as if they existed.

S01–S16 were also not run. Following the instruction to proceed only after the minimum path succeeds, no virtual clock or separate local implementation was created as a substitute for live verification. Did not wait for a Defer boundary on the real clock.

## 4. Connection Questions from Published Specifications

### 4.1 Sites is a storage-platform candidate; conversation integration is separate

Official Sites documentation describes a host execution environment, D1 for structured data, and Site access controls. It also describes Sites use on web/desktop and explicit launch with `@Sites`. [W1]

This alone does not establish that an arbitrary Sites app is connected as an in-conversation ChatGPT UI or business tool. Demonstrate in one round trip where Sites opens, UI operation, data operations from conversation, and user identity mapping.

### 4.2 Widget state is not the task source of truth

Official MCP UI documentation describes an MCP server returning a UI resource and calls through an iframe in ChatGPT and the MCP Apps bridge. Business state is stored server-side; `widgetState` and `localStorage` should not be used as cross-conversation sources of truth. [W2]

Therefore, displaying HTML, retaining a selection, or saving a file does not pass M0-03–M0-05. Evidence must show that UI and conversation retrieve the same saved task ID and latest state.

### 4.3 The contract connecting Sites login to MCP user identity is unverified

Official Sites documentation says that authenticated requests include values such as `oai-authenticated-user-email` and that authorization is performed on the server. [W1] Official authenticated MCP documentation describes OAuth, resource/audience, and token verification on each request. [W3]

The existing Ariadne design derives an internal userKey from verified `issuer + subject` and does not merge separate accounts based only on matching email. **Being able to retrieve Sites authentication data and safely mapping MCP requests to the same Ariadne user are separate verification questions.**

This is not a measured defect or lack of support in Sites. If choosing Sites, read the actual authentication/call contract and verify that both paths reach the same user's source of truth. Do not use client-supplied user IDs, email strings, or conversation wording as authorization evidence. Do not publish a Site or API just to avoid a login redirect.

## 5. Candidate Comparison and Decision This Time

| Candidate | Reason to retain | Evidence needed next | Decision this time |
| --- | --- | --- | --- |
| Sites + D1 + in-ChatGPT display and conversation operations | Candidate for storage/execution without operating custom cloud | UI display, D1 storage, mutual UI/conversation updates, user mapping, retrieval in another conversation | Retain as candidate; not adopted or implemented |
| MCP Apps UI + business logic on Sites + D1 | Architecture hypothesis for sharing operations between UI and conversation | MCP compatibility with Sites runtime, auth/reachability, UI resource, storage measurements | Hypothesis only; do not conclude MCP can be run on Sites |
| Dedicated UI on a Page + persistent state | Prior evidence that native storage exists | Dedicated UI feature and call contract, enforcement of C1–C4, atomic updates | Unverified; Page checklist alone is insufficient |
| Existing Cloud Run + Firestore + MCP UI proposal | Existing design corresponding to requirements | Test real connection/storage/auth only after deciding to pursue external infrastructure | Retain as alternative. Do not create or deploy now |

The result from the earlier Page test—completion of a parent with an incomplete child was accepted—is retained in the [preliminary record](note-20261001-chatgpt-only-feasibility.md). Do not describe it as a result reproduced this time or as behavior of a dedicated app on a Page.

## 6. Minimum Conditions and Operations to Resume

The need is not to reopen broad design or build infrastructure; it is **a conversation environment with working operations in native ChatGPT Sites or Pages that support a dedicated UI, plus usable official instructions**. Official guidance describes starting with Sites and using Skills/tools in a new conversation after plugin installation. [W1][W4] It is not yet verified that these operations would resolve limitations in this account.

In an environment with the required capabilities, narrow the handoff run to:

1. Read the relevant tool schema/Skill, check private access settings, and create exactly one verification artifact. Do not replace the existing preliminary Page. If the result is unknown, check whether it was created before retrying.
2. Record where the UI appears in ChatGPT and the artifact URL/ID. Add one fictional “sample task — UI entry” and retrieve the actual task ID, save result, and revision. Close and reopen the UI and read the same ID's saved content.
3. Rename that ID in conversation to “sample task — conversation update.” Confirm it in UI after refresh; then rename it in UI to “sample task — UI update” and retrieve it in conversation.
4. Retrieve the same source of truth from a separate conversation. Record ID, title, revision, and retrieval time returned by storage, not copied from the original conversation.
5. Proceed to C1–C4 and S01–S16 only after these pass. For Defer, compare retrievals immediately before and after the real-clock boundary; independently verify time-zone changes, parent-child/dependency behavior, conflicts, and retry of the same operationId. If no separate user actor is available, leave user isolation unverified.

The task names above are **fictional future test input**, not data saved this time. Keep date/time, client, display location, operations, before/after state, and retrieved result in the run log. Do not log private authentication data.

## 7. What Changed and Did Not Change This Time

- Only this verification note was changed. Acceptance criteria, technical selection, and MVP scope were not changed.
- No application code, UI, MCP, Skill, or database implementation was created. Do not state that app automated tests, live device tests, or `docs lint` were run.
- No Site/Page creation, modification, or sharing; no external cloud creation/deployment; no added service connections or permission changes. Existing personal tasks, email, and calendar were not read or changed.
- Recorded E02–E05 and the M0-01 stop point so the next person does not repeat the same search only. Recheck in an environment with different capabilities and proceed to an end-to-end app run.

## Official References Consulted

Checked on 2026-10-01. Documentation review is separate from live evidence.

- [W1: ChatGPT Sites](https://learn.chatgpt.com/docs/sites)
- [W2: Add UI to your MCP server](https://developers.openai.com/plugins/build/chatgpt-ui)
- [W3: Authentication](https://developers.openai.com/plugins/build/auth)
- [W4: Plugins](https://learn.chatgpt.com/docs/plugins)
