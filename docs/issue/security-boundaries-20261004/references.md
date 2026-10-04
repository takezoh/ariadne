# Reference pack: security boundaries

Checked: 2026-10-04 (Asia/Tokyo). This is a source map, not a copy of third-party documentation. Specifications below are pinned where practical; provider documentation is a live reference and must be checked during implementation.

## Primary specifications and guidance

| ID | Primary source | Relevance and limits |
| --- | --- | --- |
| R1 | [MCP 2025-11-25: Transports](https://modelcontextprotocol.io/specification/2025-11-25/basic/transports) | Streamable HTTP Origin validation, request/notification handling and session semantics. Local/Remote transport does not itself establish authorization. |
| R2 | [MCP 2025-11-25: Authorization](https://modelcontextprotocol.io/specification/2025-11-25/basic/authorization) | HTTP transport authorization, protected-resource metadata and credential checks. The HTTP authorization flow is not the stdio credential mechanism. |
| R3 | [OpenAI: Plugin authentication](https://developers.openai.com/plugins/build/auth) | OAuth resource-server duties, challenges, linking and client-facing tool metadata. Metadata is not server-side enforcement; use the Site-managed contract where the platform owns this layer. |
| R4 | [OpenAI: Sites](https://developers.openai.com/codex/sites) | Currently redirects to ChatGPT Learn. Describes platform identity forwarding and server-side authorization responsibility. The fetched text does not prove every stable-ID, header anti-spoofing or Worker-bypass assumption used by Ariadne. |
| R5 | [OWASP: SQL Injection Prevention](https://cheatsheetseries.owasp.org/cheatsheets/SQL_Injection_Prevention_Cheat_Sheet.html) | Parameterized data values and allowlisted identifier choices. An ORM name alone is not evidence of safe SQL. |
| R6 | [Cloudflare D1: Prepared statements](https://developers.cloudflare.com/d1/worker-api/prepared-statements/) | Native prepare/bind semantics for data values. |
| R7 | [Drizzle: SQL template and sql.raw](https://orm.drizzle.team/docs/sql) | The tagged SQL builder parameterizes values; raw fragments bypass that protection. Neither mechanism implements application ownership policy by itself. |
| R8 | [Cloudflare D1: Database / batch](https://developers.cloudflare.com/d1/worker-api/d1-database/) and [Limits](https://developers.cloudflare.com/d1/platform/limits/) | Atomic batches and generated-value/query budgets. The documented string/BLOB/row limit is 2,000,000 bytes. Native behavior must be verified through the Worker D1 harness, not inferred only from Python SQLite. |
| R9 | [OWASP: Authorization](https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html) | Deny-by-default behavior, least privilege and consistent access-control enforcement. |

The Local-public / Remote-private split, owner-bound store interface, module names and CI rules in the proposal are Ariadne design choices. They are not claimed to be requirements imposed by all of these sources. Generic per-tool OAuth examples do not require Ariadne to mix anonymous and authenticated capabilities in one server.

## Current repository references

Pinned baseline: `8df525bdf82a203b138425b6fdb9675a647d7e1b`.

- S1: [INSTALL.md](https://github.com/takezoh/ariadne/blob/8df525bdf82a203b138425b6fdb9675a647d7e1b/INSTALL.md) — selected private personal Site, Site-provisioned plugin and connection workflow.
- S2: [app/mcp/route.ts](https://github.com/takezoh/ariadne/blob/8df525bdf82a203b138425b6fdb9675a647d7e1b/app/mcp/route.ts#L36-L59) — relevant dispatch re-read; authentication is inside tools/call.
- S3: [app/api/actions/route.ts](https://github.com/takezoh/ariadne/blob/8df525bdf82a203b138425b6fdb9675a647d7e1b/app/api/actions/route.ts) — Web boundary; its blob is unchanged from the historical reviewed file.
- S4: [lib/adapters/d1-action-store.ts](https://github.com/takezoh/ariadne/blob/8df525bdf82a203b138425b6fdb9675a647d7e1b/lib/adapters/d1-action-store.ts) — owner arguments, bound values, internal identifier construction and atomic commit.
- S5: [lib/server/auth.ts](https://github.com/takezoh/ariadne/blob/8df525bdf82a203b138425b6fdb9675a647d7e1b/lib/server/auth.ts) — trusted-header owner resolution.
- S6: [db/schema.ts](https://github.com/takezoh/ariadne/blob/8df525bdf82a203b138425b6fdb9675a647d7e1b/db/schema.ts) — Drizzle schema and owner-inclusive keys; blob unchanged from the earlier review.
- S7: [build/sites-worker.ts](https://github.com/takezoh/ariadne/blob/8df525bdf82a203b138425b6fdb9675a647d7e1b/build/sites-worker.ts) — production Worker entry and request-scoped platform capability composition.
- S8: [AGENTS.md](https://github.com/takezoh/ariadne/blob/8df525bdf82a203b138425b6fdb9675a647d7e1b/AGENTS.md) — existing boundaries, validation obligations and hosted-evidence requirements.

### File identity checks

| File | Blob at the current baseline | Comparison to the historical review |
| --- | --- | --- |
| lib/server/auth.ts | `7ad06037d45e687b84459c1f36e27849ac6ff51a` | Same blob; re-fetched |
| lib/adapters/d1-action-store.ts | `defab52fe8f3773b7fd45126adc298260f23c439` | Same blob; re-fetched |
| app/api/actions/route.ts | `082b3dceda7be6772bc91f5969958f9fd346b9f3` | Same blob, confirmed in the current Git tree |
| db/schema.ts | `8b75472329956177997fb5befc6f886cea2b739b` | Same blob, confirmed in the current Git tree |
| app/mcp/route.ts | `a2153963a2ddf723af2dd13b7c89c85a4be7002d` | Changed; relevant dispatch re-read, not a claim that the whole file is identical |

This is a focused baseline refresh for the proposal, not a repeat of the entire repository review, a scan of every branch, or proof of the deployed version.

## Historical evidence

The attached [original review and reproductions](ariadne-auth-sql-review-with-report.zip) target `f8142c6490314fc3723d97bac62a1323d6aa7570`. The archive contains the Japanese review report, reproduction README/scripts, saved auth/SQL results and its original checksum manifest. It is preserved unchanged.

Recorded results include bound SQL-like values remaining data, owner isolation in a synthetic schema, and a 198-byte completion request producing a 2,363,848-byte delta in the isolated model. The report also identifies missing application-level Origin/media-type checks. These statements describe that evidence, not a new hosted exploit test.

The scripts were not rerun while creating this issue package. Saved `pass: true` assertions include successful reproduction of undesirable behavior; they must not be described as proof that all security checks passed. Refer to the archive README for its environment, dependency and scope limitations.
