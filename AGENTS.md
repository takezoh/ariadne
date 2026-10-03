# Ariadne development guidance

This file defines repository-specific responsibilities, workflow and validation requirements. Respond in Japanese unless requested otherwise. Write new or edited documentation and code comments in English.

## Read first

- README.md is the user-facing product introduction, not the place for development instructions.
- docs/development.md is the development, acceptance and design entry point.
- ARCHITECTURE.md describes the current runtime, responsibilities and invariants.
- Read relevant docs/technical/data-model.md, mcp-api.md and deployment.md.
- For product changes read docs/design/product.md, assistance.md and design-action-state-and-perspectives.md and the applicable change package; distinguish historical decisions and acceptance from the current action contract.

Confirm implementation facts in code. The runtime is Sites-managed Cloudflare Worker/D1. Deployment and acceptance evidence must match the source version being evaluated.

## Product and boundaries

Ariadne is a personal app sharing structured actions between ChatGPT conversation and its dedicated UI. Its purpose is to let users delegate task management to their LLM, reduce remembering and organizational burden, and make room for action, decisions and rest.

Meaning, organization, recommendations and management method belong to the user and caller-side LLM. ChatGPT is the current delivery environment; dot is an example caller, not an Ariadne-owned component. User prompts and caller-side schedulers decide when and how to use the published task-data API/MCP tools. GTD and other management methods are caller choices. Authorized callers may collect Slack/email inputs through their own tools and save them in Ariadne without dedicated plugin integrations. Do not add an independent recommendation LLM or GTD engine. Ariadne owns persistence, input validation, transitions, containment/date integrity, revision, replay, Undo and ownership boundaries. Preserve ambiguous input as original text without invented deadlines or commitments.

The entity is action, not task. Relationships are parent-child containment only. Action order expresses intended sequence without restricting execution or visibility. Do not add prerequisite edges or sequential/parallel modes. Flagged is direct boolean state only; inheritance is a possible future feature, not the current contract.

Calendar sync, proactive notifications, background jobs and external-condition observation are caller responsibilities, not Ariadne services. Do not treat their absence in the plugin as a prohibition on caller workflows or require specialized Ariadne integrations for tool composition. Saved perspectives are supported filter-only data definitions; dedicated perspective UI controls remain outside current scope.

## Pure logic and effects

Implement transitions, validation, projection and UI state decisions as pure functions: deterministic results and no input mutation. DB, DOM, host communication, HTTP, clock and IDs are effects behind ports/adapters. Inject them at entry points; pure logic must not depend on concrete runtime implementations.

Separate pure unit tests, application tests with mock/fake ports, real adapter tests for atomicity/CAS/owner isolation, and UI state/DOM/communication tests. A passing fake does not prove the real adapter; use shared contracts and integration tests. State actual-host-only limitations explicitly.

Lint dependency direction and effect leakage. The combined harness must report failures and unexecuted/skipped tests. Fix structural responsibility defects even when that requires internal API or file-layout changes. Disclose destructive external-contract/data changes and their migration.

## Runtime and source locations

React 19/TypeScript use App Router APIs through vinext/Vite, running in a Sites-managed Cloudflare Worker with D1. Production entry is build/sites-worker.ts even though next APIs are used.

| Location | Responsibility |
| --- | --- |
| lib/domain/ | Pure action transitions, containment, dates, order, flags, delta, preview and Undo |
| lib/application/, lib/adapters/, lib/server/ | ActionStore ports, operation progress, D1/Worker effects and production composition |
| app/mcp/route.ts | JSON-RPC, tool definitions, UI resources, initial host instructions |
| app/api/actions/route.ts | Web HTTP entry, authentication, Origin and content type |
| lib/ui/, lib/widget.ts | Pure model, typed controller, DOM/communication adapters and HTML composition |
| lib/assistance.ts | Assistance-policy delivery; check initialize and snapshot assistance_policy |
| app/board.tsx, app/chatgpt-auth.ts | Shared-UI Web preview, authentication and HTTP relay |
| lib/database.ts, db/schema.ts, drizzle/ | DB binding, schema and SQL migrations |
| scripts/, build/ | Build, execution-profile and verification helpers; build contains source |
| skills/action-tools/SKILL.md | Assistance documentation, not proof of host installation |

Source code, tests, scripts, configuration, MCP tool names, UI resource URIs and the Skill use generic identifiers such as action-tools and list_actions and never contain the product name. The product name Ariadne appears only in documentation and host listings. Applied SQL migrations keep their recorded identifiers.

Conversation and Web preview share actionCall/core/store paths. Do not connect UI directly to D1 or implement alternate transitions per entry. Follow existing naming/style and avoid unrelated formatting.

## Contracts to preserve

- C1: parent Defer affects descendants' visibility without overwriting their own dates.
- C2: parent completion atomically completes all descendants; child completion never automatically completes a parent.
- C3: date-only Defer resolves the explicit client timezone's 09:00 to UTC; saved instants do not move with timezone changes.
- C4: explicit on-hold remains unfinished and in normal view unless deferred.
- Expiry appears on the next read without rewriting saved values or reopening completed actions.
- Withdrawal retains dropped records, restorable by status edits or applicable Undo.
- Order and direct Flag changes preserve lifecycle/dates and use ordinary revision, receipt and Undo guarantees.
- Writes use schemaVersion 2, an operation ID and latest owner-wide revision. Preview does not reserve state.
- Identical replay uses the receipt; different input is rejected and later corrections are never rolled back by replay.
- Conditional latest-revision validation, changed action/catalog/association rows, identity markers, receipt and history pruning share one atomic D1 batch. Do not use owner_state or full-delete/full-save storage.
- Missing responses are unknown outcomes. Retain exact IDs/arguments for lookup/replay; do not create duplicate writes with fresh IDs.
- Refresh/host notifications preserve unsaved proposals. Revision/Undo conflicts must not erase later corrections without consent.
- Trusted Sites headers determine owner. Never accept owner from arguments; owner-scope SQL and receipts.
- Unfinished is active/on-hold. Inbox is project-unassigned unfinished actions, independent of title or an organization flag.
- New original input is an ordinary action with caller-supplied title and exact raw notes. Do not automatically create tags.

## Development and checks

Use Node.js >=22.13 and package.json's pnpm version. Install with pnpm install --frozen-lockfile; avoid unrelated dependency or lockfile updates.

| Command | Purpose |
| --- | --- |
| pnpm dev | Local portable preview on port 5173 |
| pnpm check | lint, typecheck, all suites; no failure/unexecuted/skip/TODO passes |
| pnpm test | All domain, application, adapter, UI and harness suites |
| pnpm test:storage | Shared memory/SQLite contracts and SQL regressions |
| pnpm test:ui | Pure models, mock ports, host communication and generated HTML DOM |
| pnpm test:ui:built | Built Worker resource tests; start pnpm start separately first |
| pnpm typecheck / lint | TypeScript / ESLint |
| pnpm build | Worker build for the selected execution profile |
| pnpm db:generate | Generate migrations; inspect SQL |
| pnpm db:migrate:local | Local migration using built configuration; build first |
| pnpm start | Run built Worker locally |

Without .sites-runtime/execution-profile.json a checkout is portable. Use scripts/execution-profile.mjs and run-framework.mjs rather than bypassing wrappers.

Code changes require pnpm check and pnpm build. Store changes must verify competition, identical replay, missing responses, Undo and owner isolation. UI changes must verify proposal retention and unknown-result recovery. Documentation-only changes require content/reference checks; do not claim app acceptance.

Mock auth, local SQLite and Web preview do not prove hosted D1, trusted authentication or ChatGPT Work UI acceptance. Host resources require actual host retrieval/cache checks when deployed.

Before behavioral verification, inventory the existing environments and harnesses in docs/technical/testing.md and confirm their implementation. Select the environment that exercises the requested boundary: MCP-to-D1 verification must use the Worker D1 binding, not a hand-written SQLite replacement. Distinguish local Wrangler D1 from hosted D1. Try the existing path before declaring it unavailable and record any concrete failure. A lower-fidelity substitute may provide supplemental evidence but cannot close the original verification request without the user's agreement to reduce scope. Give delegated agents the selected environment, harness, acceptance criteria and substitution constraints; review their actual execution path before accepting results.

## Documents, data and deployment

User material belongs in README.md/PRODUCT.md; development instructions in docs/development.md/docs/technical/. Documents outside docs/*/** must describe only the current state, without past states or change rationale. Place historical records and change rationale under docs/*/**. Use dev:dev-docs and docs/.docs-config.yaml for change/design/ADR/note/issue documents.

Preserve .openai/hosting.json's existing Site, DB binding and private scope. A normal code change does not create duplicate Sites/Plugins or broaden access. Existing 0000/0001 migrations must not be recreated or removed.

The action API uses schemaVersion 2 without compatibility aliases or runtime data fallback. Preserve SQL migration files and infrastructure. Remote data reset requires explicit authorization and a requested deployment workflow; local migration is not hosted reset.

A release must associate source commit, artifact, version/deployment and host results; follow docs/technical/deployment.md.

Do not include dist/, .next/, .vinext/, .wrangler/, .sites-runtime/, dependencies, local settings or credentials as artifacts. Keep bundled licenses when editing vendor distributions. Never indiscriminately log action text, personal information or credentials.
