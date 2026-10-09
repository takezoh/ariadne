# Build a workflow with Ariadne

Ariadne is a shared state store for the user and authorized AI consumers. Its actions, projects, tags and perspectives are available through data tools and a shared UI. Your LLM interprets the saved state and chooses how to capture, organize, review and change it. Start with a prompt and the existing tools; use a reusable skill when the same guidance is useful across requests.

## Find tools and schemas

| You need | Start here |
| --- | --- |
| Tools available in your connection | Your host's tool discovery, or MCP `initialize` followed by `tools/list` |
| Input JSON Schema | Each discovered tool's `inputSchema` |
| Kind-specific change fields and response shapes | [API/MCP contract](../technical/mcp-api.md#tool-and-schema-discovery) |
| Lifecycle, containment, dates and saved views | [Data model](../technical/data-model.md) |
| Help choosing capabilities and designing a workflow | [action-guide](../../skills/action-guide/SKILL.md) |
| Guidance for changing saved data and recovering uncertain writes | [action-tools](../../skills/action-tools/SKILL.md) |

Read tool descriptions alongside schemas: `apply_change` and `preview_change` specify Defer inputs conditionally on `kind=defer`, while other kinds retain generic payload objects, and the server does not advertise output schemas. The API reference explains the additional contract. When designing offline, use this checkout's reference; before execution, inspect the actual connected deployment and reconcile any difference. Do not infer a connection, authentication or successful operation from the presence of documentation.

## Connect and authorize access

The README directs users to ask ChatGPT Work to install this repository as a plugin for personal use. This conversation-based route does not require Ariadne to be listed in the public plugin directory. Work can prepare the app and skills as part of creating the plugin; the absence of a prebuilt plugin manifest is not itself a reason to require the user to package it manually. The [ChatGPT plugin help](https://help.openai.com/en/articles/20001256-plugins-in-chatgpt) describes conversational plugin creation, automatic installation of local plugins and Sites-hosted MCP apps. App deployment follows the [deployment workflow](../technical/deployment.md), preserving the existing Site, DB binding and private scope when updating an existing installation.

The current delivery is a ChatGPT plugin with Sites-managed authentication. Use that environment's authorized connection. A direct MCP client needs a supported authenticated transport to the deployed `POST /mcp` endpoint; this repository does not establish such access for Codex, Claude Code or other clients. Do not invent a public URL, bearer-token setup or owner argument. Public discovery and UI metadata do not grant access to saved actions.

`POST /api/actions` is the Web preview relay, not an independently authenticated public integration API. Local mock authentication is for development and does not prove hosted access. See the [entry-point contract](../technical/mcp-api.md#entry-points-and-ownership) and [deployment boundary](../technical/deployment.md).

## Compose a workflow

Decide what should trigger the workflow, what information it may read, what changes are authorized and what the user should receive. Execution timing, external access and notifications belong to the caller's environment.

For example, a caller with authorized email access can collect requested commitments, read the current action snapshot, avoid duplicating saved actions and preserve exact source wording in notes through `capture_intent`. It can subsequently organize those actions with `apply_change` when the user's intent is clear. Scheduling that collection requires a scheduler in the caller's environment; no Ariadne email connector or background worker is needed.

For a review, query saved actions or a perspective, then present relevant candidates and reasons. A recommendation does not itself complete, defer or flag an action. A recurring extraction can be saved as a filter-only perspective; a temporary query need not create a saved view.

For writes, read the current owner-wide revision and keep the exact tool name, operation ID and full arguments. A timeout means the result is unknown: look up the receipt or resend the identical request. An explicit revision conflict requires rereading and reconciling the proposal. Undo may refuse later target corrections, and receipt history is limited to the latest 100 operations per owner. See [recovery](../technical/mcp-api.md#responses-and-recovery) before automating retries.

These examples are workflow designs, not installed schedules or evidence that a particular host has external access.

## Continue from shared state

If the user corrects an action in the UI or another authorized conversation saves a result, read the current state before continuing. `list_actions` and `get_relevant_context` return the complete owner snapshot and revision. Compare that state with the current request and any retained context, use original notes or authorized source tools where needed, and revise the proposal before saving. A shared store makes the saved correction available without requiring the user to repeat it in every conversation; it does not update an AI's conversational context automatically.

Each conversation or workflow may have read a different version. Use the current revision for writes and the existing conflict/recovery contract. Recover any context that was not saved through the caller's own environment. Completing a read does not complete an Action or mark information as read by the human.

The [Change Cursor proposal](../design/product.md#change-cursor-proposal) would support changes since each consumer's previous position. Until that API is implemented, use the current snapshot and query tools; do not send cursor arguments or treat retained write receipts as a change feed.

## Use the optional skills

| Skill | Purpose |
| --- | --- |
| `action-guide` | Answer capability questions, explain state and sketch caller workflows with their required host capabilities |
| `action-tools` | Execute authorized saved-list operations with revision, replay and Undo handling |

Neither skill is required by the server. Tool discovery and caller-facing initialize/snapshot guidance remain available without them. A skill is useful when an assistant needs reusable instructions beyond the tool's input fields. The guide is advisory: loading it does not authorize writes. Choose the operation skill for an actual saved-list request.

The folders under `skills/` are distribution sources, not proof that a host has installed them. Copy the complete selected folder, including `references/`, into your host's supported skill location. Current official documentation lists `.agents/skills/` in a project or `~/.agents/skills/` for Codex, and `.claude/skills/` in a project or `~/.claude/skills/` for local Claude Code. Follow your environment's policy and verify discovery after installation. These locations come from the [Codex skill guide](https://learn.chatgpt.com/docs/build-skills#where-codex-loads-local-skills) and [Claude Code skill guide](https://code.claude.com/docs/en/skills#where-skills-live).

Installing a local skill does not connect the MCP server, establish authenticated access, install it in ChatGPT or configure a scheduler. The skills use generic identifiers; Ariadne is the product and host listing name.

## Skill or subagent?

Use a skill to supply reusable product knowledge and workflow guidance in the caller's existing conversation. A separate subagent can help when repeated documentation research needs an isolated context or a restricted tool set; its configuration belongs to the caller's host. The supplied guide uses the portable `SKILL.md` format and does not require a subagent runtime.

The official [OpenAI skill guide](https://learn.chatgpt.com/docs/build-skills) describes loading detailed references when needed. Claude Code's built-in `claude-code-guide` illustrates a dedicated assistant for product questions; its [subagent documentation](https://code.claude.com/docs/en/sub-agents#built-in-subagents) explains isolated contexts and tool restrictions. These are design references, not evidence that Ariadne is connected or verified in either host.
