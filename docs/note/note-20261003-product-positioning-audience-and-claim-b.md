---
id: note-20261003-product-positioning-audience-and-claim-b
kind: note
title: Product positioning, audience and claim boundaries
status: published
created: '2026-10-03'
tags: []
owners: []
relations:
- {type: references, target: design-product}
source_paths:
- README.md
- PRODUCT.md
summary: User-adopted positioning, audience, brand pillars, messaging and claim boundaries;
  product name unchanged.
updated: '2026-10-03'
---

# Product positioning, audience and claim boundaries

## Decision and source

Source: the user's adoption, in this repository conversation on 2026-10-03, of a branding proposal derived from the product's architecture. The adoption explicitly left product naming undecided at that time. The current product name is Ariadne.

Adopted direction: the product is positioned as a task list built for an AI to manage. The headline is "Hand your to-do list to your AI—without watching over it." The primary audience is individuals who want their AI to handle task upkeep, especially people for whom maintaining a to-do app became work in itself. Safe AI writes and method independence are the differentiators supporting relief from remembering. User-facing text says "AI" rather than "LLM", the tone is calm and plain, and claims stay within current contracts. The governing statement is in the [product design](../design/product.md); user-facing wording is in [README](../../README.md) and [PRODUCT](../../PRODUCT.md).

## Observations behind the decision

A limited web review in 2026-10 informed the decision. Sources were vendor help pages and third-party articles, some written by competing vendors. Product and vendor names are omitted, consistent with the repository's historical research practice.

- Several established task apps provide official AI connections, including apps inside ChatGPT and remote MCP servers. Letting an AI read and write tasks is no longer distinctive.
- Public guidance for one established ChatGPT task integration asks users to check each change before confirming. It described no undo or conflict handling; absence from documentation does not prove absence of the feature.
- AI planners make organizing or scheduling decisions inside their own apps.
- Open-source GTD-oriented tool servers fix a GTD status model or depend on a local desktop app.
- Host features cover reminders and scheduled prompts. They complement Ariadne's data responsibilities rather than compete with them.

Interpretation: delegation to an AI alone does not differentiate Ariadne. Its contract-backed differences are safe AI writes (latest-revision validation, proposal retention, receipt replay, unknown-outcome recovery and conflict-aware Undo) and the absence of a backend management method. People already settled in an established app can use that app's AI connection, so the primary audience is people for whom app upkeep was the burden. These are design judgments, not market validation or measured user outcomes.

## Scope and preservation

Updated: README, PRODUCT, the product design, the development guide's product references and the current-entry notice of the historical product brief.

Not changed: product name, runtime, API, schema, Skill, initialize/snapshot assistance text, app metadata and deployment. Completed change packages, existing notes, ADRs and recorded research keep their contents apart from the brief's current-entry notice.

## Validation

- Document graph `lint` and `lint --conformance`: passed, 41 indexed documents, no warnings.
- Local Markdown references in the six changed or new documents: no missing targets.
- Stale wording: the previous headline no longer appears in current documents. The historical brief's appendix keeps its recorded design title together with its recorded commit.
- Claim review: each user-facing promise was compared with ARCHITECTURE.md and docs/technical/mcp-api.md; Undo retention, host confirmation, assistant support and measured outcomes are stated as limits.

This is documentation validation. App tests, build and actual-host acceptance were not run, and no deployed behavior is claimed.
