---
change: change-20261003-product-rename-generic-identifiers
role: verification
---

<!-- lifecycle is owned by change.md -->

# Verification

## Local results on 2026-10-03

| Check | Result |
| --- | --- |
| `pnpm check` | lint, typecheck and tests passed: 215 tests, 0 failed, cancelled, skipped or todo |
| `pnpm build` | passed |
| `pnpm db:migrate:local` | 0000 through 0012 applied to a local D1 database |
| `pnpm test:ui:built` against `pnpm start` | passed for ui://action-tools/actions-v4.html and ui://action-tools/actions-verification-v4.html |
| Document graph `lint` and `lint --conformance` | passed, 42 indexed documents, no warnings |
| Local Markdown links in changed and current documents | no missing targets |
| Product names in app, lib, scripts, tests, build, db, skills, drizzle and configuration | only applied migrations 0005 and 0006 retain the earlier name |

## Requirement coverage

| Requirement | Evidence |
| --- | --- |
| R1 | Current documents use Ariadne; historical records identify product names generically where needed |
| R2 | Name search above |
| R3, R7 | tests/ui/mcp-display.test.mjs asserts the exact published tool set; UI, application and adapter suites call the generic names |
| R4 | tests/ui/mcp-display.test.mjs and the built Worker smoke test read the new resources |
| R5 | Code review of route, widget, preview, layout, package and Skill metadata |
| R6 | tests/adapters/atomic-row-storage.test.mjs asserts the trigger marker and stale-commit conflict; existing storage suites cover competition, identical replay, missing responses, Undo and owner isolation |

## Not verified

Hosted D1 migration, deployment, host refetch of tools and resources, the hosted plugin listing name and ChatGPT acceptance were not performed. Local SQLite, the local Worker and mock hosts do not prove hosted behavior.
