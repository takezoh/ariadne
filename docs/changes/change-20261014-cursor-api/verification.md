---
change: change-20261014-cursor-api
role: verification
---

<!-- lifecycle is owned by change.md -->

# Verification

## Official local gates

- `pnpm check`: passed lint, typecheck, and all 470 tests after the Worker harness update; 0 failed, cancelled, skipped, or TODO tests.
- `pnpm build`: passed. Built Worker artifact `dist/server/index.js` SHA-256: `135c33331e6d70054a88a99e91d190d4538be1c53d04005be0d107e95008750a`.
- Tested source worktree identity SHA-256: `4588c6b04b55188fb16870e0c2a62eaf7c0228b176cc742daa2c4985047b8896`, based on `230fb32d3c80448673e4e69d16a496f75cfb026e`.

## Local Worker D1 acceptance

`node scripts/testing/verify-worker-d1.mjs 43619` passed 11/11 scenarios against the built local Wrangler Worker `env.DB` binding (`site-creator-d1`). This was local Wrangler D1, not hosted D1. The selected direct MCP listener was discovered from the current Wrangler-owned dynamic user Worker process and verified with `POST /mcp` `initialize` (JSON-RPC 200). The Worker process had the configured D1 database file open at `.wrangler/state/v3/d1/miniflare-D1DatabaseObject/faaf2b0445ab934c3aac48ddf0cdfade8f9bac050be98993748742cdd2cb05fb.sqlite`; acceptance used the Worker `env.DB` binding, with Wrangler `d1 execute --local` only for the existing fixture setup and retained-history fault injection.

The cursor reconstruction started from revision 0 and reconstructed Actions, Projects, Tags, Perspectives, and action_tags at revision 26 across 13 fenced pages and 26 operations, then matched the shared canonical persisted projection to the authoritative snapshot. It asserted the before/after inverse deltas for Undo of all five collections/relations; generated `revision` and `updated_at` metadata are excluded from restored-value equality while all other fields and each Undo's starting state must match. It also checked empty/terminal H+1 behavior, write-between-pages and retries, replay, malformed/tampered/wrong-owner/future cursors, oldest-retained and expired positions, malformed delta and retained-gap failures, read nonmutation, and atomic rollback after a D1 batch failure.

The 1 MiB bound is on the serialized logical `ChangePage`, not the complete JSON-RPC body. The harness measured a 1,008,788-byte logical page and a 2,018,748-byte `/mcp` JSON-RPC response body with identity content encoding; MCP includes the page in both `structuredContent` and `content[0].text`. The adopted contract does not set a total wire-body limit. Owned Wrangler/workerd processes and acceptance sockets were absent after Ctrl-C cleanup.

## Evidence and limits

The concise machine-readable result is the [local acceptance summary](../../evidence/20261014-cursor-api-local-acceptance.json). The full Worker acceptance and runtime/socket JSON, source/build checks, and server logs are archived under `/home/davinci/evidence/cursor-api/raw` with SHA-256 entries in its manifest. Earlier attempts to use `:8787` and `:8788` returned 503 because those ports were proxies, not the dynamic user Worker listener. The current listener was selected by probing each socket under the Wrangler-owned Worker process; control/debug socket failures and the listener classification are in the archived runtime evidence. The first new inverse assertion initially treated Action row metadata as byte-for-byte restorable; the observed Undo correctly assigned a fresh revision and timestamp, so the assertion now checks all domain fields and excludes only generated metadata. A transient connection reset before the final fresh run is also retained in the archived evidence.

API-1 through API-7 local evidence and code gates are complete for this bounded unit; independent re-review is pending. Parent caller-value criteria VALUE-1 through VALUE-4, hosted D1, Sites trusted identity provenance, ChatGPT Work retrieval/cache acceptance, and deployment are outside this child result and are not established or claimed. No commit, push, deployment, or remote data mutation was performed.
