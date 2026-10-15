---
change: change-20261014-versioned-perspective-query
role: implementation
---

<!-- lifecycle is owned by change.md -->

# Implementation

## Implementation

- Added strict v1/v2 perspective contracts, query normalization and reference validation, version-preserving metadata edits, versioned persisted DTOs, feed/delta handling, and recursive Undo identity checks.
- Stored v2 query JSON in the existing physical definition column behind the adapter boundary. Migration 0017 expands the discriminator to `IN (1,2)` while copying existing perspective rows and leaving other history intact.
- Updated API/MCP schemas and descriptions. Shared UI uses the query kernel against the confirmed snapshot, displays v1/v2 condition and order summaries, and applies explicit global order without inserting parent actions.
- Extended adapter, migration, API, domain, controller, generated DOM and source-bound Worker-D1 harness coverage. No hosted migration or deployment was performed.
