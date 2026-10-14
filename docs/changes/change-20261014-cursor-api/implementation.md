---
change: change-20261014-cursor-api
role: implementation
---

<!-- lifecycle is owned by change.md -->

# Implementation

The service reuses the existing owner-wide operation revision and latest-100 receipt history. It adds no second sequence, feed table, owner state row, consumer registration, deployment secret, or write path. D1 reads the live owner head, oldest retained position, and selected complete deltas together; malformed or noncontiguous history fails instead of becoming an apparently complete feed.

`get_change_cursor` and `get_changes` are schemaVersion 2 read tools in the private MCP registry and use the shared application path. They accept no owner argument. The token is a canonical versioned base64url position with a domain-separated hash of the currently trusted owner scope. It is opaque to consumers and grants no authority; every request reauthenticates and every SQL statement uses the live verified owner. Decode and paging rules are pure; identity hashing remains an injected effect.

Persisted values use an explicit DTO projection shared by full-snapshot cache reconstruction and operation before/after values. It exposes current typed Action, Project, Tag, Perspective, and ActionTag fields, including boolean `flagged` and a parsed perspective filter. It excludes owner IDs, numeric database flags, serialized filter text, identity markers, and derived paths/tags/view/scopes. Bootstrap exposes `action_tags` rather than relying on derived action tag lists. Historical deltas are validated against the current schema and malformed records fail explicitly.

Pagination fixes `through_revision` on an unfenced first request, returns ascending whole operations, and carries the fence only while `has_more=true`. The terminal cursor always points to the observed head with a null fence, even for an empty result, so the next call can observe later writes. Both operation count and the serialized logical `ChangePage` UTF-8 size (at most 1 MiB) are bounded. The MCP dispatcher duplicates the page as `structuredContent` and `content[0].text`, so the full JSON-RPC HTTP response body can be larger; no total wire-body cap is specified. Repeating an unfenced request may include newer operations; repeating a fenced request returns the same logical page while retained.

The implementation touches the existing application port/service, D1 adapter, shared type/domain projection, server scope adapter, private MCP registry, test harness, and caller/technical documentation. `response()` joins projected display actions to persisted DTOs using an identity map to preserve linear lookup. Current API behavior and caller boundaries are documented in the [MCP contract](../../technical/mcp-api.md), [data model](../../technical/data-model.md), and [workflow guide](../../usage/agent-workflows.md).
