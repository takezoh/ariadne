---
change: change-20261003-effect-boundaries-test-harness
role: implementation
---

# Responsibility and Boundary Implementation

The architecture is described in [Testing Design](../../technical/testing.md) and [Architecture](../../../ARCHITECTURE.md).

- Place core, delta, preview, Undo, response, and assistance constants in `lib/domain/`. Pass time as an argument and use fixed values for timezone validation.
- Run the application through the semantic TaskStore in `lib/application/ports.ts`, with injected clock and ID generators. Keep SQL in `lib/adapters/d1-task-store.ts`, Worker bindings in a dedicated adapter, and composition in `lib/server/`.
- Keep D1 CAS, all writes, and receipts in the same batch. A shared-contract direct-commit retry test exposed reuse of an old token guard; clear the token at the end of the batch to fix it. Derive result/delta from the snapshot to eliminate contradictory input.
- Separate the UI into a pure model, typed application controller, HostPort response interpretation, DOM/communication/acceptance adapters, and HTML composition. Run production and acceptance HTML in JSDOM to exercise the real code.
- Add `test:ui:built` to run the normal and acceptance UI resources from the built Worker against a mock host. This allows source tests and artifact tests to be checked separately.
- Share the Node test runner and TS loader. Remove writes to shared generated files and import-string replacement. Keep legacy script entry points as compatibility shims for the shared runner.
- Reject inward-to-outward dependencies and side-effect references with `scripts/lint/boundaries.mjs` and ESLint. Lint the Worker source under the build directory as well.
- Run lint, typecheck, test, and build through `scripts/check.mjs` and GitHub Actions. Prevent warnings, unexecuted work, and skipped work from being reported as success.

No migration was changed; the unused `db/index.ts` was removed. Preserve compatibility entry points for existing core/tasks/assistance/database modules and the public MCP tool contract. Embed functions in HTML through a closed factory that makes dependencies explicit.
