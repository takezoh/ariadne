---
change: change-20261014-cursor-caller-value
role: requirements
---

## Context

The change-cursor API is caller-owned state: callers retain their own context and only advance their own cursor after processing. A useful VALUE assessment needs separate evidence for actual initial consumers, a saved UI correction, and fresh consumers restored with saved context. Harness setup must not be mistaken for model or product acceptance.

## Requirements

1. The CLI accepts one absolute manifest and one JSON operation on stdin. Manifests fix a synthetic owner, local MCP endpoint, caller-specific evidence directory, tools, resources and capabilities.
2. Read-only manifests reject all live mutators: `capture_intent`, `apply_change`, `undo_change`, `add_action` and `rename_action`.
3. Write manifests may narrow `apply_change` by `writeKinds`, `writableActionIds` and `writeFields`. Action IDs must be recorded fixture IDs; checks happen before MCP HTTP calls and before generated UI resource retrieval for a disallowed intervention target.
4. Write requests preserve exact operation identities and arguments for unknown outcomes. A missing transport response is recorded as unknown; retries and `operation_status` remain tied to IDs recorded by that caller.
5. Each caller's logs, identity ledger, snapshots, outputs and checkpoints live under its own external evidence directory. Paired fixture owners may be shared by listing their recorded fixture IDs in each manifest.
6. A checkpoint requires nonempty output and context files under the caller's evidence directory and a cursor observed from a successful full snapshot or a successful terminal `get_changes` page (`has_more: false`). A `get_change_cursor` response, retrieval event or intermediate page alone is insufficient.
7. Fixture setup creates only synthetic state. JSDOM drives the generated UI resource and real MCP tools/call bridge, but its host initialization remains synthetic and is not human/ChatGPT Work acceptance.
8. Actual models, their proposal quality, user outcomes and restored-context behavior are evaluated by the main session for this unit and are not inferred from harness tests.


## Captured caller-value criteria

Source: captured Issue #20 request and the adopted VALUE-1 through VALUE-4 definitions from parent Issue #16. No scope reductions or user corrections were supplied.

- VALUE-1: An actual consumer with prior context retrieves a real generated-UI correction and revises its next proposal without the user explaining the correction again.
- VALUE-2: Another actual model records results/completion; a successor uses that result without re-proposing completed work or implicitly completing the parent.
- VALUE-3: Fresh callers resume from restored actual context and cursor; separately, context loss requires necessary current-state acquisition and explicit limits on reconstructing unsaved preferences.
- VALUE-4: Compare identical objectives/interventions with full-state reread/client comparison, judging actual re-explanation, stale assumptions, handoff explanation and unrelated reorganization. Report parity or failure honestly; bytes/tokens alone do not establish value.

The main session owns independent assessment, candidate binding and local commit. Parent Issue #16 retains final combined acceptance. Local Wrangler D1 and JSDOM evidence do not claim physical-human, hosted identity/D1 or ChatGPT Work acceptance.
