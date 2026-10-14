---
change: change-20261014-cursor-caller-value
role: implementation
---

## Responsibility

The harness is a local test adapter around the published MCP endpoint and generated UI resource. The manifest is the per-caller authority boundary; the CLI records requests, responses and identity/cursor evidence beneath the caller's external evidence directory. Product semantics remain in the Worker and caller behavior remains in the actual model consumer.

## Interface

Run one operation at a time:

```sh
node scripts/testing/caller-value.mjs --manifest /absolute/path/run.json < operation.json
```

The manifest requires `schemaVersion: 1`, a unique synthetic `runId`, `purpose`, `dataClass: "synthetic"`, local `http://127.0.0.1:<port>/mcp`, a registered `issue20-...` owner ID, evidence directory beneath `/home/davinci/evidence/issue20`, capabilities, permitted tool/resource names, and recorded fixture UUIDs. The setup manifest may use `prepareFixture`; later caller manifests can share the same owner and fixture IDs while using separate run IDs and evidence directories.

An initial caller manifest with `mcpWrite: false` must list only reads. For a producer that may update only the validation child, narrow the manifest to `permittedTools: ["list_actions", "apply_change"]`, `writeKinds: ["edit"]`, `writableActionIds: ["<validation-child-id>"]`, and `writeFields: {"edit": ["notes", "status"]}`. That caller may preserve its exact notes proposal and set status on that one fixture. The bridge rejects any other target, change kind or payload field before sending the tool request. `writableActionIds` must be present in that caller manifest's `fixtures.actions`.

Operations are `discover`, `call`, `resource`, `prepare_fixture`, `ui_intervention`, `snapshot` and `checkpoint`. UI intervention reads the registered generated HTML resource, drives its real DOM event handlers in JSDOM and routes its `tools/call` messages through the same local Worker bridge. MCP resource contents may use `{uri,mimeType,text}` without a `type` field. Host initialization/display replies in JSDOM remain synthetic.

Per-caller `events/`, `ledger/`, snapshots and scenario artifacts are append-only JSON under its manifest evidence directory. The ledger records exact write identities before HTTP so an unknown response can be looked up or retried with the same operation. Checkpoint requires nonempty consumer output/context files and a successful complete snapshot cursor or terminal feed cursor. `get_change_cursor`, a retrieval event and an intermediate page cannot finalize a checkpoint.

## Limits

The bridge, fixture setup and JSDOM checks do not run or score LLM consumers, verify physical UI behavior or establish hosted D1/authentication. Their outputs cannot close the paired caller VALUE scenarios; the actual initial callers, UI correction and fresh restored callers must be executed and reported separately.
