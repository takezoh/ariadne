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

## Security boundary checks

`pnpm check` enforces dependency direction, effect leakage, exact native-SQL and private-capability locations. Local composition can import only its static registry and stdio transport; aliases and re-exports cannot introduce a privileged shim. `tests/harness/architecture-fixtures.test.mjs` uses the actual repository ESLint configuration to reject raw D1 imports in both HTTP entries, pre-auth private response branches, alternate MCP handlers, catch-path dispatch and missing dispatcher capability validation. Adapter mutations also remove owner predicates, binds and conflict keys and require rejection. These structural checks complement runtime tests; they do not establish hosted header provenance.

The application receives only an owner-bound store (`readSnapshot`, `readReceipt`, `hasUndo`, `commit`). The declarative MCP route exports only the authenticated server facade; its request boundary obtains identity before its sole private dispatch. The private dispatcher validates the issued capability before every method, including discovery and notifications. Privileged dependencies use exact importer-to-module edges; HTTP entries have no whole-file D1 exemption. The request authentication boundary issues a frozen identity capability; the adapter rejects unissued structural objects and binds the validated owner to every SQL path. No owner-taking application facade remains; owner-taking test helpers live only under `tests/helpers/`. Closed descriptors select tables and columns, with values bound as data. Generated receipt payload/result/delta, bulk row JSON and identity markers are budgeted before the atomic batch; oversized plans return `operation_too_large` without a write. Requests use actual streaming UTF-8 byte limits and cancel oversized bodies.

`pnpm build` creates the private Worker under `dist/server` and an independent static stdio server under `dist/local`. `pnpm start:local-mcp` launches the latter with an empty environment. `node scripts/testing/verify-local-mcp.mjs` checks the built artifact, launch and tool surface without accessing D1.

Verify the actual MCP-to-D1 path with `pnpm build`, `pnpm db:migrate:local` and `pnpm start`, then `node scripts/testing/verify-worker-d1.mjs`. The harness creates unique local fixture owners and a temporary owner-specific failure trigger through Wrangler `d1 execute --local`; it never targets hosted data. An optional numeric port targets the same Wrangler-managed user Worker listener when the dev proxy itself fails. Preserve the failed proxy evidence and confirm the listener's process, built configuration and `env.DB` binding before choosing it. This does not substitute a mock store. Local Wrangler D1 still does not establish hosted D1 or trusted identity provenance. Set `ACTION_TOOLS_EVIDENCE_PATH` to write the harness record to an authorized evidence path and `ACTION_TOOLS_SERVER_LOG_PATH` to capture Worker logs.

See [local Worker evidence](../evidence/20261009-local-worker-security-direct.json), [dev-proxy failure](../evidence/20261009-local-worker-security.json) and [local artifact evidence](../evidence/20261009-local-mcp-security.json). These record base commit, worktree file hashes, artifact digest and actual execution conditions. The dev-proxy boundary and all hosted identity, bypass and connection/UI gates remain unmet.

### Local acceptance matrix (2026-10-09)

Authorization is GitHub comment `6082041393`, author `github-773366`, selecting option 2: local implementation, actual Worker/Wrangler D1 verification and independent review, with hosted acceptance explicitly unmet. No deployment, push, PR or pipeline change is included.

| Boundary | Evidence and result |
| --- | --- |
| Full local gates | [check log](../evidence/20261009-security-revision2-check.log): lint, typecheck and 393 tests pass; [build log](../evidence/20261009-security-revision2-build.log): Worker and separate local artifact build |
| Private dispatch and transport guards | Direct Wrangler-managed Worker listener: every private method and session bypass rejected without auth; valid discovery/resources/notifications work; Origin/media type/actual UTF-8 guards pass |
| Owner/SQL/storage | Actual local D1 binding: exact SQL-like data, same IDs across owners, replay, competition, response discard/recovery, conflict-aware Undo and pruning pass |
| Atomicity | Owner-specific failure trigger in real local D1: receipt, revision, rows and identity markers roll back together |
| Parent and six notes | Six 7,000-character notes save and complete atomically. Six `"あ".repeat(65536)` notes produce an envelope over 1 MiB and return HTTP 413 before dispatch; an individual 196,608-byte note exceeds the generated JSON bind budget and returns `operation_too_large` before a batch. Snapshots and receipt checks confirm no writes |
| Structural mutations | Actual-config raw DB imports in HTTP entries, pre-auth response/alternate-handler additions, facade identity removal/catch dispatch, dispatcher capability-validation removal and wrong identity forwarding fail the gate; owner WHERE/bind/conflict-key, alias/re-export and native SQL mutations also fail |
| Local artifact | Separate stdio launch uses an empty environment, lists only setup/diagnostics, rejects private calls, and contains no private registry or D1 binding |
| Wrangler dev proxy | Failed: intermittent 503 with the recorded restart message; direct Worker listener is a distinct transport result. The process reports a broken Cap'n Proto RPC connection; the exact root cause is unproven |
| Hosted identity, bypass, connection/UI | Not run; no hosted acceptance or deployment claim |

The source is the dirty worktree identified by the evidence's file hashes and `worktreeSha256`, based on commit `26ef02df1b58b365bc2b68853163656dc3993e53`; that base commit alone does not identify the tested candidate. Independent Loop assessment remains separate from these producer observations.

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

## Reorder measurements

The generated client is built from ordinary TypeScript imports before check, test and build. The DOM suite includes controlled animation frames for pointer and native drops at both viewport edges and document scroll limits. Those tests establish local scheduling and emitted intent, not actual browser scrolling or host behavior.

Run `scripts/testing/measure-widget-browser.mjs` against a running built Worker. Supply `ACTION_TOOLS_PLAYWRIGHT_CORE` with the absolute path to a session-local Playwright Core module, `ACTION_TOOLS_CHROME_PATH` with the installed Chromium executable and `ACTION_TOOLS_EVIDENCE_PATH` with an authorized external evidence path. Keep dependency installations and browser binaries outside repository artifacts. The harness retrieves the actual MCP UI resource and records its digest and source file hashes, then supplies a controlled in-memory host bridge; this does not exercise the Worker D1 binding. Its synthetic fixtures contain N=100, 1,000 and 5,000 actions in root/child groups (maximum hierarchy depth one), and report visible inbox actions, completed actions and completed children, action–Tag memberships, rendered Tag occurrences, unique tagged Actions, long notes, wrapped titles and selected IDs/occurrences. Current N=100 and N=1,000 runs use three warmups and twenty measured pointer-hover samples and repeated DROP-to-local-update trials from the same restored synthetic action state. N=5,000 is one hover stress diagnostic only. Each repeated drop verifies the restored action-state hash (revision is intentionally excluded), clears selection, disables native row dragging for that pointer-only trial, confirms no pending operation before the gesture and checks exactly one synthetic `action_move` bridge call. Native drag remains a separate N=100 smoke scenario. The harness records raw queue/RPC/application/row-reconcile phase samples and takes one screenshot of a visible drop indicator and one after the local drop update per N=100/N=1,000 fixture. The optional `UiDiagnosticsPort` is enabled only on the harness resource and does not expose action text in the normal widget.

The first source-bound attempt timed out during a pointer probe and later at a hidden Tags control; its retained failure trace is historical evidence of harness defects, not a successful run. A subsequent bounded run captured source `69cee0344623395bf8b6c842777f7b0a07eb233bad8822c8365f2d01c702c40e` and built-resource identities in external evidence `ux-recovery-successor-validation-browser.json`. It returned the UI resource with HTTP 200 in Chrome 153 and completed pointer-hover, Tag-occurrence, pointer-drop and saving-only stages at N=100, 1,000 and 5,000; native drag, touch, auto-scroll and IME stages ran at N=100 only. Its result is `partial`: physical-device touch/OS IME, paint presentation, hosted D1 and source-matched ChatGPT Work remain unverified. At N=5,000 it measured 4,779 visible rows, 5,455 Action–Tag memberships and 57,354 disabled-attribute writes over seven list renders. That result predates the changed-only disabled setter and same-target aria-live fix; it is not evidence for the current source.

This harness does not establish Worker-D1 writes, trusted authentication or actual ChatGPT Work. Complete browser acceptance also requires native and touch gestures, scroll/wrapping/resize invalidation, external updates, multiselection and keyboard chooser behavior, browser traces and exact counters for list rendering and repeated intent/fingerprint computation. Measurement endpoints must remain distinct: first eligible row `MutationObserver` callback is a DOM-update observation, not paint; input-to-rAF-callback latency uses `performance.now()` sampled inside the callback in the same frame clock as the input, while the callback's rAF timestamp is retained separately as a scheduled frame boundary; the second `requestAnimationFrame` timestamp is also a scheduled frame boundary, not presentation; a screenshot confirms captured rendered content only at its own completion time. The screenshot completion time is an upper-bound observation and must not be attributed to the earlier rAF callback. The harness samples one screenshot per N=100/N=1,000 fixture to limit measurement overhead, so it does not claim repeated visible-update p50/p95 or paint-presentation latency. Chrome `RunTask`, `FunctionCall`, `Layout` and `Paint` events are trace diagnostics and do not prove compositor presentation. Application `snapshot.merge` and `view.render` spans are inclusive and can overlap; the actual `dom.patch.rows` interval is nested within rendering. Do not add these intervals as a non-overlapping partition. Record fixture dimensions, source, artifact/resource digest and unverified scenarios. These synthetic-bridge observations do not establish network or D1 performance, paint presentation or actual Work acceptance. They can support a bounded implementation decision when the observed cost and user-visible behavior justify it; these limits are not additional mandatory timing gates.

The current P3 decision is to retain confirmed-snapshot structural updates and complete snapshot/hidden-sibling semantics, without adding optimistic structural projection, virtualization or delta responses. The bounded P0–P2 diagnosis separates early pending feedback from acknowledgment-dependent row updates: substantial measured delay belongs to the synthetic bridge and tracing path, while row reconciliation is not the demonstrated dominant cost. The confirmed user-visible defect was ambiguous pending/unknown/failure feedback, addressed by projected state icons and visible labels beside Refresh. This decision does not claim that all application response work is negligible or that the current approach scales without limit; reconsider it when applicable evidence demonstrates a remaining user-outcome defect. Actual Work inline/fullscreen, shared-state redisplay and IME observations remain a separate mandatory boundary on the evaluated deployment.


### Interaction recovery checks

`tests/ui/interaction.test.mjs` exercises occurrence identity, immutable gesture transitions, related-region invalidation, date/view proposal retention and catalog acknowledgment correlation. Application tests verify that repeated same-target hover neither renders nor copies the owner snapshot, drafts or unchanged view subtrees. DOM regressions verify exact child-control identity after selection/refresh/reorder, Escape selection controls, scroll-free focus recovery, and unfinished IME text followed by an external correction and newer final text.

The browser harness records selection keys, unique Action IDs, count and actual cleanup-control visibility before and after cleanup. The second cleanup before Tags can legitimately find an empty selection at N=1,000/5,000 because the intervening interaction smoke is assigned to N=100; it asserts that empty state instead of clicking a hidden button. Canceled hover must preserve the full nonempty selection observation. Auto-scroll captures both the held-pointer observation and the final position immediately before release, then checks the post-save position and exact focused child identity. IME refresh checks the original input node as well as raw text, caret and focus.

A server start and termination are preparation and cleanup, not independent exit-zero checks. Source-bound browser verification must own the Worker process in one bounded lifecycle: capture source/artifact identity, start through `pnpm start`, await readiness, run built-resource/browser checks, and stop the recorded process group in `finally`. Record every check result and server exit, and reject changed source/artifacts. A deliberate SIGINT server exit is cleanup, not application verification failure. These controlled-host observations do not establish Worker D1 writes, actual Work, physical-device IME/touch, compositor presentation or a P3 performance decision.


### Pending feedback and resource identity

Separate the first pending-state DOM update from the server-confirmed structural row update. Hold the controlled host reply to inspect the visible Refresh icon and its accessible live description before acknowledgment, then release the same reply and inspect the confirmed state. The live description is visually clipped; a nonempty DOM rectangle is not proof of visible text. Check the visible icon under normal and reduced motion and keep screenshot completion separate from DOM and animation-frame callbacks. The Refresh button keeps its action, accessible name and DOM identity while its state icon changes. Unsettled labels beside Refresh remain visible without relying on animation or offscreen recovery panels; verify unknown and error wording and small-viewport layout separately from the clipped live description. Header size changes invalidate active drag geometry through the existing ResizeObserver; unchanged pointer motion retains its cache.

Browser measurement output records `resource.rawResponseSha256` for the Worker resource text before instrumentation and `resource.instrumentedHtmlSha256` for the HTML with diagnostic attributes added. Historical `resource.sha256` values identify instrumented HTML, not the unmodified response. Preserve historical evidence without relabeling its bytes.
