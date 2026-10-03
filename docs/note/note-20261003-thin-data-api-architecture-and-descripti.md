---
id: note-20261003-thin-data-api-architecture-and-descripti
kind: note
title: Thin data API architecture and descriptive context assessment
status: draft
created: '2026-10-03'
tags: []
owners: []
relations: []
source_paths: []
summary: Record the user-established thin API policy and assess optional project,
  tag and perspective descriptions without changing runtime behavior.
---

## Assessment

The user established this architectural policy on 2026-10-03: API/MCP exposes the data layer thinly while guaranteeing flexibility, robustness and safety. Humans and LLMs decide how the data is used. See [Architecture](../../ARCHITECTURE.md). The description proposal below is not implemented or an independently verified implementation plan.

## Observed implementation

[Schema](../../db/schema.ts) stores action notes but no project, tag or perspective description. [Domain](../../lib/domain/core.ts) supports project/tag name edits and perspective name/filter edits. [API](../technical/mcp-api.md) provides shared revision, preview, receipt and Undo guarantees. A database column alone would not expose context to callers.

## Recommendation

Add one optional free-text `description` to projects, tags and perspectives. Purpose, scope, examples, exclusions, background and user notes are possible uses, not required sections or validated meanings. Do not add both notes and description without a demonstrated need. Empty text represents no description. Preserve supplied text and line breaks without automatic summaries, inferred content or inheritance.

Descriptions are useful to humans and LLMs; improved LLM understanding remains a hypothesis. Include them in owner-scoped reads returning the entity, consistently across MCP and HTTP. They do not change identity, uniqueness, membership, lifecycle, dates, order or flags.

A perspective filter remains the deterministic extraction definition. Description provides context for interpretation or explicit filter-change proposals. A prose/filter mismatch must not cause silent reinterpretation, filter weakening or semantic rejection of free text.

On edit, omission preserves the value and an explicit empty string clears it. Get-or-create must not overwrite an existing description as an incidental creation effect; existing records require an explicit edit. Initial descriptions can be accepted for newly created records. Exact payload shape and bounded text/request sizes remain implementation decisions.

## Architectural consequences

Expose composable state operations without requiring a GTD sequence, a classification meaning or fixed assistance prompts. Recommendations are caller policy, not backend validation rules. Convenience tools can share the general operation contract without gating access to it.

Thinness retains trusted ownership, typed input, reference integrity, deterministic transitions, atomic writes, revision checks, replay, unknown-result recovery and conflict-aware Undo. It does not require arbitrary SQL access. Saved descriptions are untrusted data, even when they resemble instructions; they cannot authorize other operations.

This policy does not automatically expand relationship types, filter expressiveness, external integrations or background execution. Existing containment/lifecycle semantics remain explicit contracts. Future restrictions should have a concrete integrity, safety or resource justification rather than assume one way of using the data.

## Future implementation and verification

No runtime or migration changes are part of this assessment. Implementation must cover domain types/validation, additive migration and persistence, delta/history/receipts/Undo, MCP/HTTP inputs and read results, and any editing UI. Existing descriptions should default to empty without a reset.

Verify exact text round trips, omitted-versus-empty edits, existing get-or-create behavior, concurrency, replay, response loss, Undo conflicts and owner isolation. Descriptions must not change perspective matching or classification. Code changes require check and build; actual host retrieval and assistance usefulness require separate evidence.
