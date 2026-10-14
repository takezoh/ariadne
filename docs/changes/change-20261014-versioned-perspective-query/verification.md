---
change: change-20261014-versioned-perspective-query
role: verification
---

<!-- lifecycle is owned by change.md -->

# Verification

## Verification

Focused regressions cover the final confirmed-snapshot correction and MCP/snapshot delivery of the versioned Perspective assistance contract:

```text
node scripts/generate-widget-client.mjs
node --import ./scripts/testing/register-loader.mjs --test --test-name-pattern='saved Perspective visibility|saved Perspective queries|saved v1 and v2 perspective summaries|v2 global perspective order' tests/ui/application.test.mjs tests/ui/dom.test.mjs tests/ui/navigation.test.mjs
2 tests passed, 0 failed, 0 skipped.
```

Final repository verification for the recorded source identity:

- `pnpm check`: passed lint, typecheck, and all 525 tests (0 failed, 0 skipped).
- `pnpm build`: passed all Worker client/server/RSC/SSR and local Worker build stages.
- Dev-docs `docs lint`: passed with 0 warnings.
- `node --check scripts/testing/verify-worker-d1.mjs`: passed; this unit prepared the source-bound Worker-D1 scenarios but did not start the real Worker D1 harness, which the parent Issue Main owns.
- `git diff --check`: passed.

`docs lint --conformance` could not run to completion because the installed conformance checker raises `AttributeError: 'str' object has no attribute 'get'` while reading existing active design `boundaries.forbidden` string entries. Regular docs lint passed. Production SQLite adapter and migration tests passed in `pnpm check`. Independent review and local commit remain pending with the Issue 27 Main. The combined Worker-D1 execution belongs to the parent Issue 14 Main and remains pending. Source identities before/after check and build, complete changed-file hashes, and command log bindings are recorded in the external Issue 27 evidence directory. No hosted D1 or ChatGPT Work acceptance is claimed.
