---
change: change-20261003-classification-tree-inspector
role: requirements
---

# Requirements

Projects/Tags display the complete catalog hierarchy and exact-membership Actions, replacing the classification dropdown. Catalog selection changes inspector and Add context rather than filtering the outline. Unassigned/Untagged remain available. Existing Defer choice applies to Actions; explicit On hold remains visible. Parent Action classification is never inherited.

Tag membership may show one Action under several catalog nodes. Occurrence keys govern focus, active row and exact contiguous Shift range; Action UUIDs govern the shared draft, persistence and Undo. Plain selection replaces the range. Mutations deduplicate UUIDs and preserve canonical Action order. Catalog headers are not Action drag targets. Expansion, scope and filter changes clear live range without discarding drafts or frozen operations.

Selecting an Action shows its existing inspector. Selecting a Project/Tag shows Name, Description, readonly parent context and inline child creation. Names remain nonempty and trimmed; descriptions preserve exact raw text. Ordinary edits autosave without Save or Review dialogs. IME, caret, newer typing, external field overlap, deletion and unknown result recovery retain their original typed target. Child creation uses existing get-or-create parent_id, server-generated identity and exact replay. No catalog drag/delete is added.
