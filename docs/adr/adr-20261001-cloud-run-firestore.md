---
id: adr-20261001-cloud-run-firestore
kind: adr
title: Choose Cloud Run and Firestore for the MVP runtime
status: superseded
created: '2026-10-01'
decision_makers:
- main-session (based on the user's direction to continue the design)
tags: []
owners: []
relations:
- {type: references, target: change-20261001-structured-todo-mvp}
source_paths: []
summary: MVP technology selection. Live connection and cost evidence gates were not run. The contract is defined in implementation.md.
confirmation: Verify selection conditions and counterexamples with T0/T1/T2/T5 contract and scenario checks. Not run.
updated: '2026-10-01'
---

# Cloud Run + Firestore Standard

## Context and rationale

Serverless was requested by the user. The MVP is structured ToDos and Defer, without calendar integration or independent inference. Select the technology based on candidate comparisons and the direction to continue the design. The [implementation document](../changes/change-20261001-structured-todo-mvp/implementation.md) owns the contract.

## Decision

Choose a TypeScript/Node.js Cloud Run service and Firestore Standard. The React UI is a versioned MCP resource from the same service. Use min instances=0 and request-based billing. Pin a managed auth SDK after verifying compatibility. This selection does not mean it was tested on a real device.

## Alternatives and disposition

Lambda + DynamoDB is viable, but Cloud Run/Firestore was preferred for this effort to avoid implementing an HTTP server and tuning list queries. Reconsider PostgreSQL if multi-level joins or flexible search become primary needs. Do not initially connect the Firebase client directly; unify authorization and update paths between MCP and UI. Availability of an existing Cloud Run service or GCP account was unverified.

## Consequences

- Positive: Runs a conventional HTTP server statelessly without starting with a DB connection pool or persistent worker.
- Negative: Depends on Firestore indexes, read charges and SDK/IAM. Measure full-graph reads and cold starts.
- Neutral: The Task/Relation domain model is independent of persistence. Deployment, billing configuration and auth connection are separate work.

## Confirmation and invalidation conditions

Measure live OAuth/Streamable HTTP/UI connectivity at T0 and Firestore operation count, latency and cost by data volume at T5. If connectivity fails or cost/contention is unacceptable, reconsider the selection without weakening the contract.

## Sources

[Google: Cloud Run MCP](https://docs.cloud.google.com/run/docs/host-mcp-servers), [Firestore transactions](https://firebase.google.com/docs/firestore/manage-data/transactions), [OpenAI auth](https://developers.openai.com/plugins/build/auth). Checked 2026-10-01.
