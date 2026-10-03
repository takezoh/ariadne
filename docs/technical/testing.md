# Effect boundaries and verification

Pure domain/UI model functions must be deterministic and preserve their input. DB, DOM, HTTP, host messages, clock and IDs are injected effects. The current product model is ordered actions with direct flags and containment only; obsolete prerequisite tests are replaced by rejection/no-constraint tests. Historical migration tests still use their original schemas.

## Plugin, caller and outcome evidence

Verify Ariadne's published data operations and shared UI separately from user-defined LLM workflows. Correct reads/writes do not prove a caller's GTD review, Slack/email collection, scheduling or notification behavior. Those are caller responsibilities and do not require dedicated Ariadne integrations. Evaluate reduced remembering and management effort using the chosen caller configuration and user evidence, rather than inferring it from storage tests.

## Layers and contracts

Domain contains lifecycle, validation, dates, containment, rank/flag projection, delta, preview and Undo. Application depends only on domain and ActionStore/clock/ID ports. Adapters implement SQL and communication effects; server composes production dependencies. UI application owns state through call/ID/view ports; DOM is rendering and event wiring, not an alternate state-transition implementation.

ActionStore reads consistent owner snapshots and receipts, checks Undo markers and commits before/after state. The adapter derives result/delta. Receipt revision CAS, changed rows, markers and history pruning commit or roll back in the same batch. Initial reads create no rows.

## Commands

Use Node.js >=22.13, the package.json pnpm version and frozen lockfile installation.

| Command | Scope |
| --- | --- |
| pnpm check | lint, typecheck, all suites; any failed or unexecuted gate fails |
| pnpm build | Worker artifact through the execution-profile wrapper |
| pnpm test:domain | Pure transitions, dates, containment, order, direct flags, nonmutation and Undo |
| pnpm test:application | Orchestration with injected store/clock/ID |
| pnpm test:storage | Memory/SQLite shared store contract and actual SQL regressions |
| pnpm test:ui | Pure models, controller/host ports and generated HTML in JSDOM |
| pnpm test:ui:built | Built Worker resources with a mock host; run pnpm start separately first |
| pnpm test:harness | Boundary lint and runner failure detection |
| pnpm test:coverage | All suites with Node coverage; coverage is not proof of correctness |

The recursive runner discovers .test.mjs/.test.ts/.test.mts. Empty selection, missing file execution, failure, skip, TODO, cancellation or launch failure cannot pass. Per-test timeout is 120 seconds and the child-process timeout is 300 seconds. TypeScript transformation is separate from type checking.

Boundary lint rejects effect references in pure logic, concrete adapter dependencies in application/UI controllers, and mutation of pure-function arguments. build/ source is linted; generated output and local settings are excluded. Explicit timestamp conversion is allowed; current time and randomness belong to ports. The CI workflow runs frozen install/check/build on Node 22 and 24; a local pass is not a CI execution or branch-protection change.

## Environment and harness selection

Choose the environment from the requested outcome before writing a new harness or delegating execution. Inspect the existing configuration and scripts, then use the established path.

| Environment or harness | Existing entry | Evidence it can establish |
| --- | --- | --- |
| Memory and SQLite contracts | `pnpm test:application`, `pnpm test:storage`; [SQLite helper](../../tests/helpers/sqlite-d1.mjs) | Application logic and production SQL against a test implementation of the D1 interface |
| Local Worker with D1 binding | [Vite binding configuration](../../vite.config.ts); `pnpm build`, `pnpm db:migrate:local`, `pnpm start` | MCP HTTP requests through Worker composition and the Wrangler local D1 implementation |
| Built UI resource harness | `pnpm test:ui:built` after `pnpm start` | Worker resource delivery and mock-host UI behavior; its tool responses are mocked |
| Hosted Worker and D1 | Existing Site in [.openai/hosting.json](../../.openai/hosting.json), authorized MCP connection, `open_verification` | Deployed operations against hosted D1; the fixture supports intentional client response loss |
| Actual ChatGPT Work | Conversation and dedicated UI against the selected deployment | Caller behavior, host resource retrieval and rendering, and conversation/UI shared state |

For an MCP-to-D1 request, send calls to the running Worker using its D1 binding. Do not replace `cloudflare:workers` with a hand-written SQLite binding and describe the result as D1 acceptance. Local Wrangler D1 is also distinct from hosted D1; specify which environment was requested and used. Historical hosted evidence identifies its recorded source version and does not establish current deployment behavior or access.

Before execution, record the scenario, source version, selected environment, harness and observable acceptance criteria. For LLM behavior, have the caller choose tools from the supplied prompts and discovered contract; a prewritten prompt-to-call mapping tests only those calls. Record any additional context, examples seen by the caller, and retry failures.

Attempt the existing execution path before claiming an environment is unavailable. If it fails, retain the command or tool call, exact failure boundary and unresolved acceptance criteria. Continue independent checks, but label lower-fidelity results as supplemental. They cannot replace the requested environment or complete its acceptance unless the user agrees to the reduced scope. Do not infer authorization to reset hosted data, deploy or broaden access from a verification request.

Delegation must include the chosen environment and entry point, acceptance criteria, permitted data scope and substitution constraints. The receiving reviewer must check the actual transport and binding used, not only a producer's pass summary. Reports identify what was executed and what remains unverified; partial success does not close the original request.

## Storage and UI fidelity

Memory ActionStore does not execute SQL. SQLite tests run production adapter statements and migrations with transactions, checking atomic failures, CAS, owner isolation, identical replay, receipt pruning, Undo conflicts and lost responses. Migration 0009 is tested against populated old data from both owners and verifies that retired tables/history are gone. New order and flag tests verify default append, destination scopes, tie breaking, strict validation, direct-only flags, Defer preservation and later-sibling completion without blocking.

JSDOM runs the HTML/JavaScript generated for the actual resource with controlled timers. It checks dirty proposals, confirmations, conflicting or malformed responses, exact-request retries, on-hold/dropped records and the one-response-discard fixture. These tests do not write hosted D1 or verify an actual ChatGPT host. Built-resource tests additionally retrieve Worker HTML, but still use a mock host.

Local SQLite/mocks cannot prove D1 distributed behavior, Sites header injection, ChatGPT sandbox/cache behavior or conversational assistance. Historical Work evidence covers its recorded deployed version. The action model needs actual host verification when deployed; see [deployment](deployment.md).

## Perspective verification

Domain tests verify strict extraction conditions, AND/status-set semantics, null versus omission, direct flags, Defer inheritance/expiry, classification descendant deduplication, nonmutation and unchanged tree-relative order. CRUD/preview/Undo tests protect full-filter replacement, deleted identities and Project/Tag references.

Memory and production-adapter-on-SQLite tests exercise owner separation, CAS, exact replay, unknown-response recovery and conflict-aware Undo. Migration 0010 is tested against populated records and receipts for both owners, without resetting them. SQL failure triggers verify atomic rollback of views/receipts/markers, and abort triggers on existing action/catalog/association tables prove that perspective-only writes and Undo do not rewrite those records.

Local evidence does not prove hosted D1 or ChatGPT host retrieval/caching of the added tools.
