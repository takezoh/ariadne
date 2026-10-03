---
change: change-20261003-inbox-task-model
role: verification
---

# Verification record

- 26 domain, 12 application and 27 UI tests passed. Covered attribute updates, waiting/Defer filters, parent completion cascade, independent child reopen, arbitrary ref order and editing dropped tasks.
- Persistence tests checked completion of a 120-descendant subtree. An intermediate SQL failure rolled back tasks, receipt and revision; on success all 121 tasks completed in one operation.
- Migration checks covered original input, corrected notes, wait reasons, owner isolation, no changes to existing Tags, preservation of terminal status, ID collision, UTF-16 limit, Unicode leading whitespace and NUL rejection.
- Independent review approved. 26 independent domain and 65 storage tests passed. Fixed Unicode length and whitespace/NUL title issues raised by review. Root's final full check passed the terminal-status/NUL case too.
- Final `pnpm build` passed. `pnpm db:migrate:local` successfully applied migration 0006 in local Wrangler.
- `pnpm test:ui:built` passed for regular and verification HTML resources.
- Used HTTP API/MCP against the local built Worker to write with a fake owner. Checked full input text, AND query for waiting/Defer/unassigned Project, parent-child completion, Undo, old receipt replay and tool schema. Both entry points returned the same D1 state. This is not production authentication verification.
- Ran docs lint, declared-scope/diff comparison and `git diff --check`. `pnpm check` passed lint, typecheck and all 144 tests (no skips/TODOs).

Production D1, Sites authentication, the real ChatGPT Work host and deployment were not tested.
