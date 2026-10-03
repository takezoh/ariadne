---
change: change-20261003-atomic-row-storage
role: verification
---

# Verification record

- 59 persistence tests passed. With 2,000 tasks, editing one row preserved unchanged rows and rowids; saving still worked with triggers rejecting DML on catalogs/relationships.
- A failed dependency INSERT rolled back the earlier task, capture, receipt and revision.
- Checked adapter retry under same-operation conflict, different input, existing CAS behavior, recovery after missing response, Undo, owner isolation and catalog ABA.
- Checked migration 0005 rejection of missing history, removal of unused columns, retry/Undo of legacy task receipts and retry that preserves later corrections.
- 29 domain/application and 23 UI tests passed. Used actual DOM interactions for date Defer, preview with client time zone, UTC resolution and saving until after confirmation.
- Independent review approved. It found a P1 bug where date UI did not send time zone; fixed it and added regression checks before approval. The independent reviewer also reran 59 persistence and 23 UI tests.

- `pnpm check`: lint, typecheck and all 123 tests passed (no skips/TODOs).
- `pnpm build`: final Worker build passed.
- `pnpm db:migrate:local`: all migrations 0000-0005 applied in local Wrangler.
- `pnpm test:ui:built`: regular and verification UI resources fetched from the built Worker both passed.

Production D1, Sites authentication boundary, the real ChatGPT Work host and deployment were not tested. The 2,000-task test verifies delta writes, not a performance ceiling. Full reads, in-memory relationship checks and global-revision conflicts remain; no maximum supported task count is specified.
