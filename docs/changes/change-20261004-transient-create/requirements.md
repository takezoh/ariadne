---
change: change-20261004-transient-create
role: requirements
---

# Requirements

Add immediately opens an editable local row without an API write. Action creation requires a valid nonempty Title; Notes are optional and preserved exactly. Project/Tag creation requires a valid nonempty Name. All explicitly edited fields must be valid. Untouched abandoned rows are purged; genuine edited provenance survives clearing the text. Invalid and incomplete proposals remain available and may be explicitly discarded.

Local parent/classification dependencies commit first. Ineligible, invalid, composing, pending or failed dependencies keep their children waiting; no implicit root fallback or retry storm is allowed. Required ancestors, saved Action classification references and the explicit next selection protect temporary rows from pruning. Discard refuses transitive edited dependents.

Transport accepts only confirmed real IDs. Typed receipt recovery remaps identity/reference fields while preserving raw text and newer input. Notes-only local Actions remain unsaved until a valid Title is entered. Unsupported initial lifecycle/date edits are queued through ordinary operations after creation. Navigation and IME retain their original target and late replies do not reopen older views.

Explicit Add while a local object is selected discards that proposal before creating one replacement in its persisted context. This exception applies to edited proposals as well as untouched ones; pending/unknown persistence and protected dependent references block replacement instead of losing identity. Closing an untouched local catalog inspector purges the row immediately; edited or protected rows remain.
