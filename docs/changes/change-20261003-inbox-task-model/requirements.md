---
change: change-20261003-inbox-task-model
role: requirements
---

# Acceptance criteria

Scope: DB/API/MCP, related state handling, and UI adjustments required by column removal or API changes.

- Store original input, unorganized and organized items as the same `tasks`. Caller supplies an ordinary title; `notes` stores editable original text. Do not use a fixed title or organization state to determine meaning.
- Inbox is a projection of incomplete tasks without a Project. The user/LLM decides whether to assign a Project.
- Statuses are `open/waiting/done/cancelled`. `waiting` is an explicit saved value and a perspective filter. It is independent of derived `is_deferred` from Defer.
- Keep the API thin by exposing attributes and relationships. Allow all statuses and `defer_until` through ordinary edit. Do not enforce organization target/array order, relationship removal before dropping, prohibition on editing cancelled tasks, or rejection of clearing the user's own `until` while an ancestor is deferred.
- Preserve parent-child/dependency references and cycle checks, types, authentication, revisions, atomicity, retries and Undo conflicts. Withdraw the former C2 behavior: completing a parent completes all descendants in the same atomic operation.
- `query_tasks` accepts no filters or combinations of status/`is_deferred`/`project_id` (including null)/`tag_id`. Filters do not change saved values.
- Migrate old `capture`/`manual_wait`/`source_capture_id` without data loss and do not create Tags automatically. Preserve old receipts and identical retry behavior. Explicitly reject Undo of migrated features from legacy operations.
- Run check/build, DB adapter checks and required UI checks. Production deployment and real Work acceptance are not part of this request.
