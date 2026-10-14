---
change: change-20261014-widget-selection-context
role: requirements
---

<!-- lifecycle is owned by change.md -->

# Requirements

## User-visible contract

- A caller can inspect the explicit selection and active inspector in the
  currently loaded widget through the widget-local `get_selection_context`
  tool.
- Explicit selection and active inspector are separate. An empty selection
  never falls back to the active item.
- The response represents the latest confirmed widget snapshot and includes
  only typed IDs, basic titles/names, status/classification, and view/selection
  metadata. It excludes notes, drafts, private text, and owner/authentication
  data.
- Item IDs are paired with a kind and the loaded widget's instance ID. Local
  unsaved items expose an opaque local key and kind, not a durable ID or text.
- `contextVersion` changes only when the exported context changes. Reading the
  context does not refresh data, allocate IDs, mutate selection, end IME
  composition, or imply permission to write.
- Action-only bulk operations are enabled only when every selected occurrence
  maps to an eligible saved Action. Mixed, missing, local, or otherwise
  ineligible selections disable the operation as a whole.

## Acceptance criteria

1. The static local tool definition declares its exact read-only output schema
   and all four annotations. Its description states the active/selected
   distinction, confirmed-snapshot semantics, typed instance-scoped IDs, lack
   of write consent, and existing authenticated/current-revision write path.
2. `tools/list` and `tools/call` are handled within the widget, before
   initialization as appropriate, and local reads never reach a backend
   endpoint. Unknown tools, invalid parameters, and unknown methods return the
   appropriate JSON-RPC errors.
3. Read projection preserves current visible occurrence order, typed catalog
   identity, temporary creation-reveal visibility, and view-specific
   classification. It does not expose local text or use active selection as
   a fallback.
4. Host inbound requests take precedence over outbound pending replies with
   the same numeric or string ID. Malformed method-bearing response-shaped
   messages do not resolve pending calls; disposal suppresses queued local
   handlers.
5. Catalog click replaces the explicit selection; modified clicks toggle it,
   including when deferred across IME composition. Mixed selection remains
   blocked in an already-open move chooser.
6. UI tests, full `pnpm check`, `pnpm build`, and the built Worker resource
   smoke test pass with no skipped or unexecuted tests. Actual ChatGPT Work
   discovery/routing remains unverified absent host retrieval evidence.
