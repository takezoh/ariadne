---
change: change-20261003-effect-boundaries-test-harness
role: requirements
---

# Requirements and acceptance criteria

The user requires separating side effects from pure behavior, placing UI/DB operations behind ports/adapters/mocks, making logic pure and thoroughly tested. Do not optimize for the smallest diff; repair responsibilities/boundaries/structure, allowing necessary breaking changes to internals.

- Domain and UI models return the same result for the same input and do not mutate inputs.
- Application code does not depend on concrete DB, DOM, Worker, host communication, current-time or ID-generation implementations. Pass side effects through explicit ports to adapters.
- TaskStore provides owner-scoped snapshots, receipts, Undo checks and atomic commit. Apply shared contract tests to mocks and the D1 SQL adapter.
- UI controller manages saved state, drafts, reviewed changes, busy state, unknown-outcome requests and Undo target. DOM handles rendering and event wiring.
- Missing save responses, invalid receipts and timeouts are unknown outcomes; retain and retry the same operation ID/input. The controller itself also rejects new writes while an outcome is unconfirmed.
- Lint detects side effects in pure layers and wrong dependency direction. Run type checking and the full test suite in one harness; do not count unrun tests, skips, TODOs, cancellations or failures as success.
- Preserve C1-C4, MCP schemaVersion 2, existing data, owner isolation, revisions, retries and Undo semantics.

Production deployment, DB initialization, publication-visibility changes and repeat device acceptance in ChatGPT Work are out of scope. Delegation to an external provider was rejected by automatic approval review; the user explicitly chose implementation and independent review using Codex sub-agents in that session.
