# Development and acceptance guide

[README](../README.md) and [PRODUCT](../PRODUCT.md) describe the product. [Architecture](../ARCHITECTURE.md) describes current responsibilities and implementation. Development instructions belong here and in technical references.

## Product and caller boundary

Ariadne is a shared state store for the user and authorized AI consumers, exposed through API/MCP operations and a shared UI. Actions, projects, tags and perspectives are its current structured model for everyday work and personal state. User prompts, the caller-side LLM, dot and caller-side schedulers choose the management method and execution timing. GTD is one possible use. External collection, Slack/email access, observation and notifications belong to the caller; composing its tools with Ariadne does not require a dedicated plugin integration. Preserve flexible operations and stable data guarantees when changing the plugin.

The intended benefit is less total remembering and management work, with more attention for action and rest. Plugin correctness, caller workflow quality and user outcomes require separate evidence. Product text must stay within the claim boundaries in product design. See [product design](design/product.md) and [caller responsibilities](design/assistance.md).

## Current contract and references

Actions have containment, sibling order and direct boolean flags. Independent prerequisite edges and parallel/sequential execution constraints are unsupported. Writes use schemaVersion 2 without compatibility aliases or runtime data fallback.

| Reference | Purpose |
| --- | --- |
| [Data model](technical/data-model.md) | Durable state, order, flags, lifecycle and atomicity |
| [MCP/API](technical/mcp-api.md) | Current tools, payloads, responses and recovery |
| [Caller workflow guide](usage/agent-workflows.md) | Tool/schema discovery, optional guide/operation skills and caller composition |
| [Testing](technical/testing.md) | Effect boundaries, suites and validation limits |
| [Deployment](technical/deployment.md) | Local/hosted environments and release procedure |
| [Product design](design/product.md) | Product positioning, audience, claim boundaries and hypotheses |
| [Assistance design](design/assistance.md) | Host/application responsibility split |
| [State design](design/design-action-state-and-perspectives.md) | Current state contract |
| [Change Cursor proposal](design/product.md#change-cursor-proposal) | Proposed incremental reads, consumer checkpoints, value and open design decisions |

Current facts must be checked in code and the technical references above. Documents outside docs/*/** describe only the current state. Historical records and change rationale belong under docs/*/**.

Current full-state reads return a complete owner snapshot and revision. Change Cursor is a proposed API for retrieving changes after a supplied position and returning the next position; it is not a current tool. Keep its interpretation and follow-up decisions in the consuming LLM, and keep proposed change-feed behavior separate from existing mutation deltas, replay receipts and revision guards.

## Local development

Use Node.js >=22.13 and the packageManager version in package.json. Install with pnpm install --frozen-lockfile. Do not update dependencies or regenerate the lockfile without a relevant requirement.

```sh
pnpm install --frozen-lockfile
pnpm check
pnpm build
pnpm db:migrate:local
pnpm start
```

pnpm dev runs portable preview on port 5173. A checkout without .sites-runtime/execution-profile.json is portable; use the execution-profile and framework wrappers rather than bypassing them. build/ contains source files and must not be deleted as generated output. Generated artifacts, dependencies and local/auth settings must not enter source changes.

## Acceptance and release

For code changes run check and build. Store changes require atomic failure, CAS, replay, unknown-response recovery, Undo and owner-isolation tests. UI changes require dirty-proposal retention and exact-request recovery. Documentation-only changes require content/link checks, not claims of app acceptance.

Before behavioral verification or delegation, follow [environment and harness selection](technical/testing.md#environment-and-harness-selection). Use the existing environment that exercises the requested boundary; supplemental mocks do not replace that acceptance.

The current runtime is Sites plus Cloudflare Worker/D1. Preserve the existing Site, DB binding and private scope. Applying local migrations does not reset hosted D1.

A release must associate source commit, artifact, version/deployment, timestamp, access scope and actual host results. Hosted cache, tools and UI resources must be checked after any relevant deployment.

The host skill file is documentation until actually installed/delivered. Ariadne does not itself run notifications, calendar sync, external observation or background execution. A user may arrange these in a caller workflow; validation of that workflow belongs to its own execution environment.
