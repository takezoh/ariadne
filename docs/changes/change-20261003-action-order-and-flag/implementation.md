---
change: change-20261003-action-order-and-flag
role: implementation
---

# Implementation

Actions replace tasks, with action_id/action_tags, ActionStore/actionCall, action-named tools and POST /api/actions. No compatibility route/tool is retained. Domain snapshot/delta/store/UI remove independent prerequisite state and operations. Explicit on-hold survives separately from Defer.

Order uses safe integer ranks with deterministic ID ties, not dense indices: duplicates/gaps are valid and neighbor records are not rewritten. New/moved actions append within the parent scope, or root project/Inbox scope. Read projection is parent-first with ordered siblings; filtering preserves relative order. Order imposes no execution restriction. Rank exhaustion rejects append and requires explicit renumbering.

Flagged is direct boolean state. SQLite stores 0/1 and the adapter converts the saved value to boolean. It is available on add/structure/edit and query. UI exposes a direct mark, editable Flag, rank control and Flag scope limited to normal-view actions. General queries can include marked deferred or ended actions.

Migration 0009 drops old task/dependency tables, creates actions/action_tags and clears disposable catalog/history/reservation rows for all owners. Existing migration history and DB binding are preserved. A generated Drizzle snapshot records the new schema; the generated SQL is expanded with the authorized reset and value checks.

Current technical/product/agent/host-skill documentation uses the action contract. Completed historical changes are not rewritten. The new action state design supersedes the former state design. No hosted write, publication or host acceptance is performed by local implementation.
