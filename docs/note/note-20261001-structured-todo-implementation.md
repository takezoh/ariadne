---
id: note-20261001-structured-todo-implementation
kind: note
title: Local implementation and Work acceptance handoff for the structured ToDo MVP
status: draft
created: '2026-10-01'
tags: []
owners: []
relations: []
source_paths: []
summary: Imported existing Sites source and implemented the MVP; 18 persistence/domain checks and 4 UI checks. Private deployment and Work retest had not been performed at the time of writing.
---
# Implementation results and next Work acceptance

## Status

Fetched and checked existing Sites source `c3171a04f3dab9970175a4f2866713b84e7038e7`, then imported the implementation into this repository. Preserved existing project `appgprj_6abe391bc8cc81918b4e842b4db293e8`, authentication, MCP Apps bridge and Sites build setup. Created a local MVP implementation candidate. Deployment, real-device acceptance of the new implementation in Work and independent review were not performed. M0 production was not changed.

## Implementation

- `lib/core.ts`: Reject parent-child/dependency cycles; parent completion/ancestor reopen; individual and inherited Defer; date-only 09:00 and time zones; separate deadlines and waits.
- `lib/tasks.ts`: Full D1 snapshot, owner revision CAS, conditional batch, immutable receipt per operation ID, delta Undo and status lookup. If conditions fail, later SQL remains unchanged; exceptions roll back atomically. Replaced M0 `last_request` checks.
- `drizzle/0001_structured_todo.sql`: Preserve original task ID, owner, title and task revision while adding owner revision and fields/tables. Initial time zone is unset and requires user confirmation.
- `app/mcp/route.ts`: Added capture/context/preview/apply/status/undo and preserved the same source of truth for UI and conversation. Reject old UI writes with `schema_mismatch`.
- `lib/widget.ts`: Regular/deferred/completed lists inside Work; task detail/relationships/Defer/wait/completion/reopen/Undo. Separates dirty drafts from saved state. Timeout means unknown outcome; supports checking/retrying with the same ID/input.
- `skills/action-tools/SKILL.md`: Instructions for saving original input, organizing meaning, preview, conflicts and identical retries. Work must verify how to add this local Skill to an automatically generated Sites MCP Plugin. The MCP descriptions document the same operation contract.

D1 updates save the owner's tasks/captures/dependencies as a full snapshot in one batch. This is simpler than row-level delta SQL but increases write volume with accumulated data; performance was not measured. Do not silently truncate snapshots.

## Verified locally

`npm test`: 18 domain/SQLite persistence checks and 4 jsdom UI checks passed. Covered BUG-01 retry after a later edit, rejecting ID reuse with different input, rejecting stale versions, only one winner in concurrent writes, rollback after a SQL failure during CAS/receipt, retry after a lost response with the same ID, Undo conflicts, C1–C4, time arrival and old-data migration. UI checks covered draft retention/comparison after conflict, explicit apply, timeout equivalent to 20 seconds, retry with the same ID/input and rerender from conversation result notifications.

This is evidence from the Node SQLite adapter, virtual clock and jsdom, not acceptance of Sites-managed D1 or the real Work host. Test results were generated in `.sites-runtime/mvp-test-results.json` (local output excluded from Git). Typecheck/lint/build and Drizzle schema/migration consistency were also checked.

## Deployment and device work remaining at the time

This Codex environment did not expose a Sites build/hosting/MCP/persistence Skill. The Sites tool description required using Sites Skills for local implementation, source preparation and artifact packaging, so the existing Site was not updated by guessing deployment steps. Existing source was read; implementation and build were prepared as local candidates.

In a Work environment with the required support, apply this source to the existing Site/Plugin and use the official Sites Skill to pin a commit, build, migrate and deploy privately. Reopen the old UI. Preserve existing data and avoid mixed writes from old and new versions.

In Work, test BUG-01/02 regressions; in-scope C1–C4 and S01–S16; before/after Defer on a real clock; restoration in another conversation; network interruption/timeout display, draft retention and retry with the same ID. Do not add authentication, separation from other accounts, CSP, platform unit tests or cost to this run's completion criteria. Do not create another Site/change sharing or switch to another cloud.

## Additional local Worker round-trip evidence

Ran the built Worker locally with Wrangler and applied migrations 0000/0001 to local D1. MCP initialize/tools/list/resources/read succeeded. With a local-only fake principal, verified add/independent reread, identical receipt retry, rejection of same ID with different input and preview/apply Defer. This did not spoof hosted Sites credentials; it was a smoke test limited to the local Worker and does not count as Work acceptance.

## Change consistency

dev-docs lint --conformance passed. After updating scope to implementation paths, dev-evidence `out-of-scope-changes.v2` returned PASS for all 85 fresh changed paths with no out-of-scope findings. This checks against declared document scope; it is not an independent code review.
