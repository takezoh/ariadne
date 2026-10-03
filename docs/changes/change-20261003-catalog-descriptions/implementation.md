---
change: change-20261003-catalog-descriptions
role: implementation
---

# Implementation

Domain catalog records contain required description strings with creation defaults. Pure validation retains exact text; project/tag edits accept either name or description, and perspective edits accept name, description or filter. Application creation validates before ID allocation and never overwrites an existing get-or-create match.

D1 reads and delta upserts include descriptions. Generated migration 0011 adds three non-null columns with empty defaults. Snapshot/query composition already spreads the catalog entities, so MCP and HTTP share the same description results. MCP operation documentation describes the new payloads.

Historical Undo supplies the empty default only to missing description fields in receipt delta records; stored receipt bytes remain unchanged. Current records require descriptions and later edits remain protected by exact state and identity comparisons.

The external opencode/Fireworks delegation was rejected by automatic review. The user explicitly selected local Codex implementation; no source was sent to that provider.
