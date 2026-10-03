---
id: note-20261002-benefit-mvp-progress
kind: note
title: Benefit-Led MVP Implementation and Deployment Restart Point
status: draft
created: '2026-10-02'
tags: [implementation, mvp]
owners: []
relations: []
source_paths: [lib/assistance.ts, lib/core.ts, app/mcp/route.ts, lib/widget.ts]
summary: Implemented MCP delivery of assistance instructions and cancellation. 21 storage/core checks and 5 UI checks passed. Deployment and live acceptance were not performed because the Sites deployment files disappeared.
---

# 2026-10-02 Implementation and Deployment Restart Point

## Implementation

GitHub source `7a0526a11c73719593672f4b4ea1812e950972cd`.

- Defined PR01–PR07 assistance guidance in `lib/assistance.ts` and included it in MCP `initialize.instructions`. Added preservation of unresolved input and priority for the latest correction to the capture/context descriptions. Synchronized `skills/action-tools/SKILL.md`. Whether the real host receives and applies these instructions has not been verified.
- Added `cancel {id}`. Save cancellation as `cancelled`, separately from completion, and make it retrievable in the cancelled view. If descendants or dependencies remain, require explicit resolution of those relationships; do not cascade changes silently. Use the shared preview, revision, receipt, identical-retry, and Undo contract. No new database migration is required.
- Added cancellation and a read-only record view to the UI. Exclude cancelled items from parent/prerequisite choices. Display ambiguous original input as a concern/reference and do not require task creation to save it.
- Retrieved and retained the Defer UTC normalization, deadline warning, original-input/ancestor-resumption display, and response-loss verification resources from Sites source `76100e70a5a6943f70f5dffdeee54c89b79100aa`.

## Local Evidence

Installed locked dependencies using Node 22.20.0 and pnpm 11.25.0. All 21 storage/core checks and 5 jsdom UI checks passed. Additional checks covered independent retrieval of unresolved captures, persistence/retry/Undo for cancellation, no-change rejection when descendants/dependencies exist, and read-only UI access to cancelled records. Typecheck, lint, and build also passed. This is not evidence of acceptance on Work or with Sites-managed D1.

## Existing Production Checked This Time

Read-only checks confirmed the existing Site/Plugin and personal-only access. Existing version 3 source is `6f824cc0662ac20a6d8872ade50c4e5d9dcf8643`, and deployment `appgdep_6abe7f8fd8008191ab16ed95647d94b9` succeeded. D1 contains tasks/captures/dependencies/operations/owner_state. A read through the connected Ariadne returned schemaVersion 2, revision 33, and 10 existing fictional tasks. Since structured MVP is already present in production, earlier statements that “the new implementation is not deployed” should not be used as a description of the overall current state. This read alone does not prove all acceptance scenarios pass.

## Deployment Stop Point

Used the official Sites `site-workflow` to retrieve the existing source into a separate checkout. Preserved and integrated the distinct GitHub and Sites histories, including Site-specific components and evidence. Retrieved migrations 0000/0001 match GitHub. A build helper failed on Windows during deployment preparation, so the project's existing build was used successfully.

After work began, the Sites plugin directory and `site-workflow`/package scripts that had been present at startup disappeared locally. Execution from the original path and a search in the plugin cache did not restore them. The official source push and archive verification could not be completed, so these changes were not pushed/saved/deployed to Sites. Existing production data and access were unchanged.

## Next Starting Point

1. Restore an environment where the official Sites deployment skill and scripts are available. Reopen the existing project and verify remote HEAD. Unpushed changes remain in the working checkout, so do not overwrite its history.
2. Compare GitHub changes since the implementation commit with the Sites remote, preserve existing updates, build, package through the official workflow, and deploy to the same personal-only Site. There is no new migration. No new Site/Plugin or database initialization is needed.
3. Verify receipt of MCP initialization assistance instructions and the new cancellation contract; accept S17–S22 on the real host. Operate the conversation and dedicated UI in Work, and record initial/final state, operation sequence, response, and version.
4. Compare evidence for S01–S16 and BUG regressions against the current deployment and accept gaps. Do not treat Codex tool reads, jsdom, or an existing successful deployment as proof that all Work scenarios passed.

The MCP App call in the current chat succeeded, but the side-panel operation target list was empty, so no UI operation was recorded. Full MVP completion has not been achieved.

## Continuation Result (2026-10-02 12:13 JST)

The stop point above was resolved. The source was pushed using the official Sites workflow, and the official package was run from Git Bash for deployment. Deployment of new implementation source `1cb495d186180c6822a1592cd6051722ba94c7e0`, deployment `appgdep_6abf1f9cd0d88191bd20be5017165740`, succeeded. Personal-only access and the existing database/migrations were preserved.

Through the Codex connection, an unresolved capture was saved and independently retrieved through context as pending. A fictional task kept the reference URL and “next week” intent in notes, without `due_at`. Retrying with the same operation ID and identical input did not duplicate it; different input was rejected with `idempotency_conflict`. A task deferred until 03:08:17.554Z was deferred before that real time and returned to normal in an independent retrieval at 03:10:27.487Z, with `due_at` still null. The 10 existing tasks were not changed. New verification data consists of one task and one pending capture. Evidence: `../evidence/20261002-benefit-live.json`.

The user expanded the Codex MCP App and operated the refresh, confirming list version 36 and the task created in the conversation. However, the resource still used the old `tasks-v2.html` UI and did not show cancellation. Updated it to the new `tasks-v3.html` screen URI and `tasks-verification-v3.html` verification screen, then reran the 5 UI checks and build successfully. Fixed Sites source `4cf3abe5ce38cde9ba25457420ed9d6f76f28f86`, version `appgprj_6abe391bc8cc81918b4e842b4db293e8~appgver_d5aa02110ba48191924cfb6970d72c05`, deployment `appgdep_6abf2114bcc48191b126aa345ed40ea1`, succeeded at 03:12:32.689320Z. URL: https://Ariadne-work-proof.take-gn.chatgpt.site .

The connected tool definition also did not yet include cancel, so the user was asked to refresh the connection. Cancellation/Undo on the new screen, host application of assistance instructions, and Work conversation acceptance of S17–S22 remain unverified. Do not treat Codex storage/read or refresh of the old screen as full Work acceptance. Next, confirm the connection definition has updated, expand the new screen, and verify cancellation through independent readback and Undo. Full MVP completion has not been achieved.

## Screen Reacceptance (2026-10-02 12:22 JST)

The user refreshed the connection, closed the old panel, and opened and expanded Ariadne again; the new screen appeared. Confirmed the cancelled view and “Saved concerns/references (unorganized).” From the details of verification-only task `4d7a58c3-0202-4e10-9117-bc5e17a00003`, previewed and saved cancellation, then independently retrieved list version 37 and `status/view cancelled`. The title is disabled in the cancelled view, with no inline edit button; the record remains readable. Used UI Undo, then independently retrieved list version 38 and confirmed restoration to `status open/view normal`. The title, notes, and null `due_at` were preserved. Also confirmed return to the normal view in the UI. Evidence: `../evidence/20261002-cancel-ui.json`.

This verifies cancellation, Undo, and shared state in the Codex MCP App. Work conversation acceptance remains incomplete. The model-facing `apply_change` schema in this chat still lacks cancel, so cancellation through conversation is unverified. The 10 pre-existing records were not changed.
