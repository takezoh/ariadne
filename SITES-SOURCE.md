# Sites source overview

This file describes the source and hosting boundary for maintainers. It is documentation, not a runtime configuration file or a plugin manifest.

Ariadne is currently delivered as a ChatGPT plugin exposing action-data API/MCP tools and a shared UI. Conversation and Web preview use the same application service and persistence path. Writes use schemaVersion 2 with owner-wide revision checks, operation receipts, identical replay and Undo.

The production entry is [build/sites-worker.ts](build/sites-worker.ts), running in a Sites-managed Cloudflare Worker with D1. [Hosting configuration](.openai/hosting.json) identifies the existing Site, the DB binding and the MCP capability. The hosted access scope is private. GitHub development source and Sites-managed source are separate; a GitHub push alone does not deploy the application. Local execution uses the repository's execution-profile wrappers and is portable without a managed profile.

User prompts, caller-side LLMs and schedulers choose how to organize actions and when to invoke the tools. External collection, observation, scheduling and notifications belong to callers. Ariadne owns persistence, validation, deterministic transitions, containment/date integrity and ownership/recovery guarantees; it has no independent recommendation LLM or management engine.

See [architecture](ARCHITECTURE.md) for current responsibilities, [development](docs/development.md) for validation and [deployment](docs/technical/deployment.md) for source publication, migrations and host acceptance.
