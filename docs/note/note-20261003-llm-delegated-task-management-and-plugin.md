---
id: note-20261003-llm-delegated-task-management-and-plugin
kind: note
title: LLM-delegated task management and plugin responsibility boundary
status: published
created: '2026-10-03'
tags: []
owners: []
relations:
- {type: references, target: design-product}
- {type: references, target: design-assistance}
source_paths:
- README.md
summary: User clarification separates flexible task-data tools from caller-owned management,
  source collection and scheduling.
updated: '2026-10-03'
---

# LLM-delegated task management and plugin responsibility boundary

## Decision and source

Source: the user's clarification in this repository conversation on 2026-10-03. The concept is simply delegating task management to an LLM, including GTD or a user-defined method. Ariadne exposes structured action data through API/MCP tools and a shared UI. ChatGPT is the current delivery environment.

Ariadne supplies data management, not a particular assistant workflow. User prompts, ChatGPT's dot and caller-side schedulers decide when and how to invoke its tools. A user can configure an authorized agent to inspect Slack/email with its own tools and save actions through Ariadne. No dedicated Ariadne integration is needed for that composition. This decision is not proof that any host has those capabilities configured.

## Outcome and benefits

Desired outcomes are less remembering, collection, organization, review and update work; more attention for action and decisions; and the ability to rest with confidence. Flexible caller policy lets users change management methods without rebuilding saved data. A shared UI and safe operation semantics retain direct control. These are intended benefits, not newly measured results.

## Scope and preservation

Product naming was outside the scope of this clarification. Current product, architecture, development, technical and Skill documentation are aligned with the clarified boundary. The historical product brief and superseded state design receive explicit current-entry notices; completed change packages, research/acceptance notes, ADR history and vendor licenses retain their recorded contents. The current product name is Ariadne.

No runtime, API, schema, dependency, migration, deployment, host scheduling or external action is changed. In particular, runtime initialize/snapshot assistance text is not modified by this documentation update; it remains a separately implemented delivery mechanism rather than backend management policy. Its current arrival example still says the user supplies arrival evidence; the revised Skill documentation also permits evidence obtained by an authorized caller. That narrower runtime guidance has not been changed or host-verified here. See [runtime guidance source](../../lib/domain/assistance.ts).

## References

[README](../../README.md), [PRODUCT](../../PRODUCT.md), [architecture](../../ARCHITECTURE.md), [product design](../design/product.md), [caller responsibilities](../design/assistance.md), [API](../technical/mcp-api.md).

## Validation

- Document graph `lint --conformance`: passed, 39 indexed documents, no warnings.
- Local Markdown references in all changed/new documents: no missing targets.
- Snapshot comparison: completed change packages, existing research/acceptance notes, ADRs and vendor license text are unchanged.
- Current-document terminology review: caller-side method, collection and scheduling are distinguished from plugin data responsibilities; superseded material has explicit current-entry notices.

This is documentation validation. App tests/build and actual-host acceptance were not run, and no deployed behavior is claimed.
