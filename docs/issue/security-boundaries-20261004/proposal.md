# Proposal: enforce authentication, ownership and SQL boundaries by construction

Status: proposed; no application change or deployment is included in this package.
Date: 2026-10-04 (Asia/Tokyo).
Source baseline: `takezoh/ariadne@8df525bdf82a203b138425b6fdb9675a647d7e1b`.
Historical review baseline: `f8142c6490314fc3723d97bac62a1323d6aa7570`.

## 1. Goal and scope

Make continued development safe without relying on each new tool author remembering authentication, each query author remembering an owner predicate, or each reviewer spotting unsafe SQL interpolation. Enforce the boundaries through composition, narrow capabilities, schema-aware SQL, dependency checks and negative integration tests.

Ariadne remains a thin action-data service. Preserve its shared application/domain path, current action semantics, schemaVersion 2, owner-wide revision, replay receipts, conflict-aware Undo and atomic persistence. This proposal does not add an assistant workflow, a new identity provider, cross-user sharing, background jobs or a generic authorization framework.

The user-selected architecture separates the MCP servers themselves: a Non-Authorized Local MCP for non-private capabilities and an Authorized Remote MCP for action data. Local/Remote are deployment/transport choices, not inherent security properties of MCP. Authentication establishes identity; authorization and owner scoping still constrain what that identity may access. [R1, R2, R9]

## 2. Verified starting point

The current installation guide describes a private personal Site and a Site-provisioned plugin/OAuth connection. Do not assume every installation shares one global database, do not replace the selected Site, and do not broaden its audience. Owner isolation must remain correct even when more than one identity can reach the same installation. The old root `plugin.json` was not found at this baseline; Local MCP packaging must be designed against the current installation workflow rather than copied from the historical manifest. [S1]

The re-read MCP dispatch authenticates inside `tools/call`, after dispatch for initialize, ping, tool discovery and resource discovery/reads. The D1 adapter accepts owner per operation, binds data values, and constructs identifiers from internal fixed definitions. The auth helper and D1 adapter have the same blob hashes as the historical review; the MCP file has changed, so its relevant dispatch was re-read rather than assumed identical. [S2-S5]

No exploitable SQL injection is established in the inspected adapter. The improvement is structural prevention of future regressions. The attached historical review reports missing MCP Origin/media-type checks and an oversized generated receipt/delta. Its local reproductions are not hosted D1 or end-to-end authentication evidence.

## 3. Trust boundaries and server split

| Surface | Allowed capability | Must not receive |
| --- | --- | --- |
| Non-Authorized Local MCP | Static help, setup instructions and non-private diagnostics | D1 binding, private ActionStore, authenticated action service, end-user token, inherited action-data credentials |
| Authorized Remote MCP | All action tools, private UI resources, receipts and perspectives after authentication | Owner selected from tool input; anonymous fallback |
| Auth/discovery infrastructure | Minimal sign-in/OAuth discovery and challenge metadata as required by the selected host | Action data or a back door to the private dispatcher |
| Web action API | The same authenticated application services as Remote MCP | An alternate unguarded persistence path |

Use separate server entrypoints, registries, build artifacts and dependency graphs. Filtering a shared registry at runtime, setting an `authorized` flag on individual tools, or merely assigning a different name to the same privileged server does not satisfy the separation.

Local setup guidance may direct the caller to already-authorized platform capabilities. Creating/publishing a Site, installing connections or changing credentials is not made anonymous by placing a helper in the Local server. Keep those effects behind their own platform authorization and explicit user intent. Avoid duplicate setup logic where existing skills already orchestrate it.

Keep Local execution isolated from private resources through the launch environment and packaging as well as imports. Do not grant shell, unrestricted file access, arbitrary network proxying or inherited bearer tokens just because the transport is local. Do not put real action data into public diagnostics or bootstrap resources.

## 4. Authenticate before private dispatch

The required composition is:

```text
Remote request
  -> transport limits / Origin and media-type validation
  -> trusted identity adapter
  -> request-scoped verified identity
  -> owner-bound service composition
  -> private MCP dispatcher and registry
  -> application/domain
  -> owner-bound store
  -> one atomic D1 unit of work
```

Every accepted private MCP request must pass authentication before JSON-RPC method dispatch or access to private resources. Include initialize, ping, tools/list, resources/list, resources/read, tools/call and notifications. Do not authenticate only at process startup or treat a prior initialize/session ID as credentials. Revalidate each HTTP request; bind any retained session/context to its identity and do not cache a mutable owner across requests. Unsupported HTTP methods may return transport-level errors without executing private code. [R1, R2]

Public OAuth discovery, sign-in entrypoints and minimal challenge responses stay outside the private dispatcher. Do not add anonymous tool/resource exceptions to work around linking UX. When the host needs per-tool security metadata, derive it from the private-server policy for client interoperability; metadata is not the enforcement boundary. Validate the actual host's linking, reconnect and resource-loading behavior. [R3]

Implement a narrow production identity adapter for the current Sites trust contract. Verify external spoofed identity headers are removed/replaced and the Worker cannot be reached through an untrusted bypass. Do not assume the mere presence of an `oai-authenticated-user-*` header proves its provenance. The fetched public Sites documentation describes identity forwarding but does not establish all stable-ID and anti-spoofing guarantees used by this application; retain these as explicit hosted acceptance gates. Do not replace the stored owner with email or silently remap existing records. [S5, R4]

If a deployment instead terminates OAuth at the application, use a standard verifier for signature, issuer, audience/resource, lifetime and required scopes. That is an alternative adapter, not permission to accept arbitrary headers or to build a new identity provider for this change. Keep local test identity injection out of production artifacts.

Missing/invalid identity must deny access before constructing private services or executing D1 work. Use the host-appropriate unauthorized challenge; do not expose action data in errors. Successful authentication does not remove resource-level authorization checks. Future finer-grained scopes must remain centralized policy checks, not anonymous bypasses.

## 5. Owner-bound persistence capability

Replace the application-facing unbound store with an owner-bound capability constructed only by the trusted composition layer. For example, its public methods become `readSnapshot()`, `readReceipt(operationId)`, `hasUndo(undoOf)` and `commit(command)`. Neither command data nor any application-facing method may contain an owner override.

The factory receives a verified identity and private database resource; callers receive only the narrow store/service interface. Keep the raw D1 binding, unrestricted Drizzle instance, SQL executor and authentication-context constructor inaccessible to tools, UI, public MCP and pure application/domain code. Do not export an `unscoped()` escape hatch or a generic `execute(sql)` through this interface.

A branded type/private constructor improves accidental-misuse resistance, but TypeScript types alone are not a security boundary. JSON validation, trusted construction, dependency restrictions, runtime scoping and integration tests are all required. Reject `owner` and other unexpected fields in request inputs rather than silently trusting them.

Binding owner once is also insufficient if the adapter can still accidentally omit the predicate. In the private SQL layer, use owner-aware operations that always compose owner with business conditions, inject owner on inserts, and preserve owner-inclusive update/delete keys, UPSERT conflict targets, joins, receipt/revision lookups, pruning and Undo. Expose named domain operations, not unrestricted query builders, to ordinary callers. Avoid a shared mutable or globally cached owner-bound store.

Preserve owner-inclusive primary/unique keys and validate cross-owner relationship references through the scoped view. Evaluate additional composite foreign keys only with a migration/transaction-order analysis; do not casually alter historical migrations or the CAS trigger contract. Maintenance and migration capabilities remain separately composed, are never MCP tools, and require explicit execution authority.

## 6. SQL construction and Drizzle

Continue using the existing Drizzle schema/migration definitions. Use schema-aware query builders or parameterized tagged SQL for ordinary adapter queries where they improve type checking and reduce duplicated column definitions. Do not set an arbitrary percentage of ORM conversion: the acceptance criterion is a small enforceable SQL boundary, not a quota. [S6, R5-R7]

All request-derived values must remain bound parameters. A normal JavaScript template literal that embeds input into SQL is not the same as Drizzle's parameterized `sql` tag. Identifier escaping alone also does not authorize access to a table. Resolve any identifier choice through private fixed/schema-derived descriptors; never accept arbitrary table names, columns, keys, SQL fragments or order expressions from request data.

Replace `rowStatements(db, owner, name: string, columns: string[], keys: string[], changes)` with closed, typed table descriptors or named table operations. Callers cannot supply identifier arrays; the descriptors are internal, immutable and validated against the schema. Preserve JSON-as-data parameter binding for bulk operations where retained.

Confine unavoidable native D1 SQL to a small reviewed module with named operations and tests. Runtime `sql.raw`, string-concatenated SQL, raw identifier factories and unrestricted `prepare/exec` are prohibited outside exact approved locations. Literal migration/DDL SQL is a separate trusted build/maintenance concern, not a general runtime exemption. Document every permitted native-SQL escape hatch.

Preserve one transaction for revision validation, receipt, changed entities, identity markers and pruning. Do not split an operation into separately awaited ORM writes. Preserve a consistent read snapshot. ORM adoption neither adds owner predicates automatically nor fixes generated-data limits; demonstrate equivalent CAS, replay and Undo behavior in the real Worker D1 path before replacement. [R6-R8]

## 7. Shared request and storage guards

Create a shared HTTP boundary policy for Remote MCP and the Web action API. Validate an Origin when supplied against trusted canonical configuration, including rejection of an unapproved `null` Origin. An absent Origin is not identity and is not automatically malicious; legitimate server-to-server requests still require verified authentication. Parse the media type exactly, accepting legitimate `application/json` parameters and rejecting `text/plain` or misleading substrings. Enforce a bounded request body before unbounded JSON parsing; a Content-Length check alone is insufficient. [R1]

Add a storage-budget check after deriving the full commit plan and before executing it. Measure encoded values, generated delta/result, receipt row and bulk JSON parameters, not only the caller's input. Respect per-query parameter/statement limits and preserve atomicity. Reject deterministic over-budget plans with a clear `operation_too_large` response and no write; reserve `outcome_unknown` for genuinely uncertain outcomes. Chunked statements are acceptable only within a single valid atomic plan. Do not claim exact SQLite row sizing by simply summing strings; choose conservative headroom and verify boundary behavior with D1. [R8]

Keep descriptions, notes, captured text and external references as inert data, never executable authorization policy. This change does not claim to solve arbitrary caller-side prompt injection. Avoid credentials and action text in logs, and preserve output escaping in existing UI paths.

## 8. Enforce the structure in CI

Extend the existing lint/harness instead of introducing a parallel development process. Enforce resolved imports/re-exports and direct effects, including aliases and dynamic imports where applicable.

| Rule | Required failure demonstration |
| --- | --- |
| Public MCP cannot reach private resources | A fixture imports the private composition/store or obtains DB credentials; architecture/build check fails |
| Private tools require guarded composition | A fixture registers a private handler outside the authenticated server; test fails before service execution |
| Application/domain cannot issue SQL | A fixture imports D1, unrestricted Drizzle or calls a database effect outside the adapter; check fails |
| Owner cannot be chosen by caller | Type-level forbidden-construction checks plus runtime unknown-field and cross-owner tests fail on a bypass |
| Native SQL escape hatches are closed | A fixture adds unsafe interpolation, raw SQL or an unapproved identifier input; check fails |
| Guard tests detect realistic regressions | Mutation fixtures remove an owner predicate/auth guard or broaden a conflict key; integration suite fails |

Use exact file/module allowlists, not a broad adapter-directory exemption that lets new unsafe code pass unnoticed. Static checks are guardrails, not a claim of complete taint analysis. Pair them with behavioral tests and review of approved low-level modules. Keep security checks in `pnpm check` and CI; skipped/unexecuted required tests must be visible and cannot satisfy acceptance.

## 9. Acceptance matrix

1. **Private dispatch:** missing/invalid identity denies every supported MCP method before private service/store use; valid identity supports initialize, discovery, UI resources and tools. Verify concurrent identities and reconnect behavior.
2. **Public isolation:** inspect the built Local artifact and launch environment; it has no DB/action-data capability, private credentials or private registry. Setup steps still use separately authorized host tools.
3. **Owner isolation:** synthetic owners A/B share entity IDs, operation IDs and classification names; test reads, mutations, relationships, projections, receipts, pruning, Undo and interleaved requests in the actual adapter.
4. **Injection:** SQL-like text, quotes, comments and Unicode round-trip as data in supported fields without query widening/schema change. Exercise all named native-SQL operations and identifier rejection. Do not reject legitimate notes merely because they resemble SQL.
5. **Request policy:** disallowed Origin gives 403; unsupported media type gives 415; appropriate authentication remains required with or without Origin; oversized/invalid bodies do not enter the service.
6. **Atomicity/recovery:** CAS conflicts, same-ID same-input replay, different-input conflict, missing-response recovery, Undo after later corrections, and failures midway through a batch preserve the existing invariants.
7. **Storage limits:** the historical parent-plus-six-long-notes case either succeeds atomically under a revised representation or is rejected before writing with a deterministic size error; test UTF-8 and near-limit generated data.
8. **Actual host:** record source commit, artifact, Site/deployment and connection identifiers; verify platform identity provenance, blocked bypasses, authorization challenge/linking and Work UI behavior. Synthetic identities/mock headers cannot close this gate.

Use the existing Worker/Wrangler D1 harness for MCP-to-storage integration. The historical Python SQLite script is supplemental evidence, not a replacement. Run hosted negative tests with controlled validation data and authorized accounts; do not read unrelated real users' data or reset the production DB.

## 10. Implementation sequence and decision gates

- **P0 — Boundary inventory and host contract:** enumerate all data entrypoints, registries, auth/discovery routes, production resource bindings and existing tests. Confirm Local packaging support and Sites stable identity/provenance. Keep unresolved platform facts explicit; do not weaken authentication to hide a linking problem.
- **P1 — Server and request split:** introduce isolated public/private composition, guard all private dispatch, share request policy with Web API and add negative tests.
- **P2 — Scoped persistence:** refactor application ports/composition and close raw DB access, preserving contracts through the existing adapter suite.
- **P3 — SQL and storage safety:** replace open identifier parameters, adopt Drizzle where suitable, isolate native SQL and validate generated commit budgets in one unit of work.
- **P4 — Regression enforcement and rollout:** install architecture/mutation fixtures, run `pnpm check` and `pnpm build`, execute Worker D1 and hosted acceptance, then update current architecture/deployment documentation and record the decision.

Do not deploy, recreate a Site/plugin, broaden visibility, change production secrets or reset data as part of merely filing this issue. Migration to another owner identity or a new receipt format needs a separate explicit compatibility plan. A completed implementation must include evidence for required gates, not just a passing unit-test summary.

See [references.md](references.md) for primary sources and baseline-specific code links. See [README.md](README.md) for the attached historical evidence and its limits.
