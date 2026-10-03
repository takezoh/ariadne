---
id: note-20261002-work-mvp-deployment-handoff
kind: note
title: Handoff for deploying and device-testing the structured ToDo MVP in Work
status: draft
created: '2026-10-02'
tags: []
owners: []
relations: []
source_paths: []
summary: Starting instructions for applying the local implementation to the existing Sites/D1/Plugin and accepting the UI, conversation and persistence result in Work. Deployment and device acceptance had not yet been performed when this was written.
---

# MVP deployment and acceptance handoff for Work

## Starting instruction (pass this unchanged to Work)

> @Sites, fetch `the original source repository` from GitHub and continue from `docs/note/note-20261002-work-mvp-deployment-handoff.md`. Record the fetched commit SHA, then update the existing Ariadne Sites, D1 and MCP Plugin from that fixed source. Do not create a Site, change sharing scope or initialize the database. Use the available official Sites Skill to build, apply additive migrations to the existing D1 and deploy; accept the MVP through the dedicated UI and conversation operations in ChatGPT Work. Do not substitute local tests for device acceptance. Distinguish successes, defects and unverified items, record the results in the repository, then commit and push. Do not add authentication, separation from other accounts, CSP, platform unit testing or cost evaluation to the completion criteria for this run.

## State at handoff time

The local MVP implementation candidate is in this repository. It imported existing Sites source `c3171a04f3dab9970175a4f2866713b84e7038e7` and implemented Defer, parent-child/dependency relationships, completion/reopen, Undo, input capture, operation receipts and unsaved-draft retention. 18 local domain/storage checks and 4 UI checks, typecheck, lint, build and local Worker round trips passed. Independent code review, deployment of this implementation to Sites and Work device acceptance had not been performed. M0 production was not changed.

Push a commit containing this handoff and implementation from the source workspace. In Work, record the fetched HEAD and verify the main files `lib/core.ts`, `lib/tasks.ts`, `lib/widget.ts` and `drizzle/0001_structured_todo.sql` exist. Do not continue from `57bc99c556315719db1b43a70ad2f5696335638b`, which contains only the old M0 design.

## Existing assets to carry forward

| Item | Fixed value |
| --- | --- |
| GitHub | https://github.com/the original source repository |
| Sites project | `appgprj_6abe391bc8cc81918b4e842b4db293e8` |
| Site | https://Ariadne-work-proof.take-gn.chatgpt.site |
| MCP | https://Ariadne-work-proof.take-gn.chatgpt.site/mcp |
| Personal Plugin | Ariadne · Work verification / `plugin_asdk_app_sites_b9cfa73bf234819184881924e7d5e92a` |
| Original Sites source | `c3171a04f3dab9970175a4f2866713b84e7038e7` |
| Original deployment version | `appgprj_6abe391bc8cc81918b4e842b4db293e8~appgver_943a61393c5481919f8feb645627b376` |
| Original deployment | `appgdep_6abe3c1c9fa4819186c41330d0768b0f` |
| Persistence | Existing Sites-managed D1, binding `DB` |
| Visibility | Owner only; do not change |

M0 has evidence for two fake tasks, save/read round trips and restoration in another conversation. Do not erase existing task IDs, titles, owners or revisions. Email/MFA sign-in and Plugin connection succeeded previously. Reuse the previous Work environment if available.

## Deployment order

1. Check the official Sites Skill/deployment tools and whether Work browser interaction is available. If unavailable, record the specific blocker; do not claim deployment. Do not assume that creating a Codex Cloud environment alone solves it.
2. Pin the fetched commit. Use Node >=22.13.0 and pnpm 11.25.0; run `pnpm install --frozen-lockfile`, `pnpm test`, `pnpm typecheck`, `pnpm lint` and `pnpm build`. Consult README and SITES-SOURCE.md.
3. Preserve the existing `project_id` and DB binding in `.openai/hosting.json`. Prepare source/artifacts using official Sites procedures. Do not include local `.git`, `node_modules`, `.wrangler`, `.sites-runtime` or credentials as deployment inputs.
4. Read and verify the existing D1 migration history and current data. 0000 is the existing table; 0001 is an additive migration, so apply only unapplied migrations using the official procedure. Do not blindly rerun 0000. `pnpm db:migrate:local` is local-only and cannot apply production migrations. Do not assume a build updates the production schema. Follow official procedures to coordinate the schema and Worker cutover and avoid mixed-version writes.
5. Deploy the update to the same Sites project. Record source SHA, version/deployment ID and migration result. The Sites URL is the production URL. Distinguish a saved version from its deployment.
6. Check that the existing Plugin can retrieve the new MCP tools and `ui://action-tools/tasks-v2.html`; close and reopen the old UI. The implementation rejects writes from an old schema with `schema_mismatch`. Update metadata on the existing Plugin if needed; do not create a duplicate Plugin.
7. Make the host able to use the capture → context → preview → apply flow in `skills/action-tools/SKILL.md`, including identical-request retry for unknown outcomes. The official method for adding this local Skill to an auto-generated Sites MCP Plugin was unverified. Its presence in the repository is not proof it is installed in the Plugin; verify actual conversation operations. The MCP tool descriptions also document the same contract.

## Additional acceptance for assistance requirements (2026-10-02)

Accept PR01–PR07 in updated requirements and S17–S22 in UX. Record initial/final state, tool sequence and response for conversations involving ambiguous concerns, existing corrections, preferences vs. deadlines, candidates vs. all tasks, dropping and unavailable notifications. Do not treat a repository Skill as delivered merely because it exists. Check the assistance instructions actually supplied and available operations such as capture/read; fix and retest gaps. Long-term benefit proof and extension schemas are not completion criteria for this run.

## Work device acceptance

Use fake data and reread state before/after each operation. Actions on the external Site alone do not pass dedicated-UI acceptance. See UX and verification for S01–S22; only S15, separation from another account, is excluded from this run.

| Area | Expected result |
| --- | --- |
| Original input/natural-language organization | Preserve original input without inventing a task from a reference; propose parent-child/dependency/deadline changes and save after confirmation. Preserve input after failure/correction. |
| UI/conversation/persistence | Add/correct in the UI inside ChatGPT; retrieve/update the same ID from conversation and reflect conversation updates in the UI. Restore from DB after closing/reopening and in another Work conversation. |
| C1 parent-child Defer | Set the child's own Defer later than the parent's. Parent Defer hides descendants; after parent returns, child's Defer remains. For inherited Defer, guide the user to the parent operation. |
| C2 parent completion | Reject completion while descendants are incomplete. Do not auto-complete parent after all children complete; allow manual completion. |
| C3 date | Show 09:00 in configured IANA zone before saving. Changing the time zone later must not change the saved return instant. |
| C4 dependencies/waiting | Keep waits in regular list with a reason. Completing a prerequisite alone does not clear manual Defer. Check waits for other people and reopened prerequisites. |
| Time/deadline | Refresh just before a Defer a few minutes in the future and after it arrives on the real clock. Regular/deferred view changes, deadline stays fixed. Check deadline-risk/past-date warnings. |
| Graph/completion/reopen | Reject self-reference/cycles. Time passing does not reopen completed work. Preview ancestor/Defer effects when reopening. |
| BUG-01 regression | Retry the same operation ID/input and retrieve the existing receipt. Reject reusing the ID with different input without changing state. Preserve original receipt after later updates. |
| BUG-02 regression | Create a conflict through two operation surfaces. Retain unsaved draft after UI refresh; compare with latest and explicitly reapply/discard. |
| Undo | Do not silently roll back later changes; show a conflict. If changes are unrelated, undo only the selected operation. |
| Unknown outcome/retry | On a Work operation surface, check input retention and unknown outcome after a network interruption/timeout. Use operation_status and retry with the same ID/input to prevent duplication. If not reproducible, mark unverified. |

Wait on the real clock. Do not report virtual-clock, jsdom or Node SQLite success as device results. Fault injection against the platform, CSP enforcement, authentication/other-account separation and cost evaluation are outside the completion criteria. Do not add sharing, calendar, notifications, another cloud or independent LLM.

## Deliverables and completion decision

Create a new `docs/note` acceptance report and evidence JSON with date/client, fixed source commit, Site/Plugin ID, version/deployment, migration, and initial state/action/reread result for each test. Separate success, defect and unverified. Exclude tokens and personal data. Do not overwrite M0 evidence.

For defects, reproduce, fix, run relevant local checks, redeploy and retest in Work. Do not call the MVP complete with in-scope items unverified. Update tasks/lifecycle only within the evidence. Do not close based on local success alone. Commit/push the changes and report both GitHub SHA and Sites source SHA if they differ.

## Reading order

1. This document (latest starting point; old M0 handoff is historical)
2. [Local implementation and evidence](note-20261001-structured-todo-implementation.md)
3. [M0 measurements](note-20261001-work-m0-sites-proof.md)
4. [Requirements](../changes/change-20261001-structured-todo-mvp/requirements.md) / [UX S01–S22](../changes/change-20261001-structured-todo-mvp/ux.md)
5. [Implementation](../changes/change-20261001-structured-todo-mvp/implementation.md) / [verification](../changes/change-20261001-structured-todo-mvp/verification.md)
6. [Sites](https://learn.chatgpt.com/docs/sites) / [Work browser](https://learn.chatgpt.com/docs/browser) / [Plugin connection](https://developers.openai.com/plugins/deploy/connect-chatgpt)
