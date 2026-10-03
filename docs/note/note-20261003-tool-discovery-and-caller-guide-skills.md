---
id: note-20261003-tool-discovery-and-caller-guide-skills
kind: note
title: Tool discovery and caller guide skills
status: published
created: '2026-10-03'
tags: []
owners: []
relations: []
source_paths: []
summary: README now routes callers to live MCP discovery and the API contract; optional
  guide and operation skills have separate advisory and execution roles.
updated: '2026-10-03'
---

# Tool discovery and caller guide skills

## Request and observed contract

The user requested access to tool/schema information, an assessment of the existing skill and a separate product guide skill or subagent. The user then clarified that README should address humans through plugin installation, LLM-based usage and a brief data-structure overview. Tool inventories and schemas belong in the guide and technical reference, reachable from the README workflow link. This is a documentation and reusable-guidance change. It does not change runtime tool definitions, delivered assistance policy, authentication, infrastructure or stored data.

[MCP source](../../app/mcp/route.ts) publishes tool definitions through `tools/list`, including input schemas. Typed changes advertise a generic object payload and no output schema. [Application validation](../../lib/application/action-service.ts) and [domain transitions](../../lib/domain/core.ts) enforce a more detailed contract. A caller needs both connected definitions and the [API reference](../technical/mcp-api.md); this checkout alone does not prove the deployed version.

## Skill assessment and chosen structure

The server does not require a skill. Initialize instructions and snapshot assistance_policy already supply caller guidance. The existing operation skill nevertheless provides reusable cross-tool rules for preserving original input, interpreting state and recovering uncertain writes. Keep it optional, shorten its entry point and retain its detailed operation guidance under its own `references/` directory. This allows copying the entire folder independently of the source repository.

The new `action-guide` handles capability questions, contract discovery and caller workflow design. Its guidance role does not authorize mutations. Its bundled references explain capability boundaries and practical compositions, while exact deployed fields come from connected definitions and the service reference. `action-tools` handles actual saved-list operations. Both use generic source identifiers as required by repository policy.

Choose a portable skill instead of a host-specific subagent definition for this request. There is no current requirement for an isolated research context or dedicated agent tool policy. A caller can later wrap guide knowledge in a restricted subagent if its environment needs that. This is an implementation choice, not a new prohibition on caller delegation.

## Design references

- The official [OpenAI skill guide](https://learn.chatgpt.com/docs/build-skills) describes a concise entry point, on-demand supporting references and Codex discovery locations. Adopt that progressive disclosure structure.
- The official [Claude Code skill guide](https://code.claude.com/docs/en/skills) documents the same `SKILL.md` pattern and its local discovery paths. Use the common format without host-specific frontmatter.
- The official [Claude Code subagent guide](https://code.claude.com/docs/en/sub-agents#built-in-subagents) identifies `claude-code-guide` as a helper for Claude Code feature questions and explains isolated contexts/tool restrictions. Use its product-question role as a reference, without copying its host-specific agent configuration or asserting that a built-in Codex guide agent exists.

These sources were retrieved on 2026-10-03. They inform packaging and routing, not proof of Ariadne tool access in either environment.

## Result and verification boundary

### Installation guidance correction

The user supplied [Plugins in ChatGPT](https://help.openai.com/ja-jp/articles/20001256-plugins-in-chatgpt) and clarified that the intended entry point is asking ChatGPT Work to install the repository as a plugin. Directory installation applies to already listed plugins and does not describe installing this unlisted repository. The same help article also documents conversational plugin creation, automatic local-plugin installation and Sites-hosted MCP apps. Absence of a prebuilt manifest does not establish that Work cannot prepare the plugin. README now uses the direct repository-install request and removes the directory-install alternative and the packaging caveat. Actual end-to-end installation has not been executed in this documentation change.

[README](../../README.md) explains plugin installation, conversational usage and data building blocks, and links to the new [workflow entry point](../usage/agent-workflows.md). That page routes the caller to the API contract and both skills and explains schema discovery, authentication boundaries, caller composition and optional installation. The API reference explicitly documents the generic payload and absent output schema.

Before this correction, README used an assisted source-setup prompt, an unverified-installation caveat and directory-installation steps based on the [ChatGPT plugin documentation](https://learn.chatgpt.com/docs/plugins) and [plugin use guide](https://learn.chatgpt.com/docs/build-plugins). Those instructions were replaced by the direct Work request above. The repository does not supply a verified install URL or prove a public Ariadne directory listing.

Validation covers documentation references, declared tool names, skill frontmatter and the documentation graph. It does not establish behavioral skill acceptance, host installation, authenticated external-client access or a deployment. Existing delivered initialize/snapshot guidance remains separate from repository skill distribution.
