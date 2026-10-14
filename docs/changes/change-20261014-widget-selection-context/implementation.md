---
change: change-20261014-widget-selection-context
role: implementation
---

<!-- lifecycle is owned by change.md -->

# Implementation

## Responsibility and design

- `lib/ui/model/selection-context.ts` performs pure typed projection from the
  latest confirmed snapshot, current occurrence selection, active inspector,
  view, and explicit local markers. It emits only the bounded output fields.
- The controller owns publication and semantic versioning. It allocates no
  identity during reads, caches unchanged visibility/context inputs, and keeps
  explicit selected occurrences distinct from the active inspector.
- Interaction transitions own occurrence selection and preserve catalog toggle
  intent through composition. Adopted event entries are copied before
  publication so freezing internal state does not freeze caller-owned values.
- The host adapter owns bidirectional JSON-RPC routing. Trusted inbound method
  requests are dispatched before pending response matching. Only methodless,
  well-formed responses can settle outbound calls.
- The DOM adapter exposes the ephemeral tool locally, registers its handler
  before host initialization, and advertises no server tools. It does not call
  a backend for local reads.
- Action-only commands are guarded by whole-selection eligibility. The
  transport keeps IDs and original arguments for unresolved writes unchanged.

## Changed surface

Implementation is confined to UI model/application/effects and generated
widget composition, the UI/host test harnesses, and current technical/change
documentation. No database, HTTP action route, authentication logic, public
MCP registry, server tool, or deployment configuration is changed.

The per-widget instance ID is allocated once at mount through the existing
injected ID port. Local occurrence identifiers remain opaque and transient;
they are not promoted into persisted identities.
