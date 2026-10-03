---
change: change-20261003-tree-gutter-drop-hit
role: requirements
---

# Requirements

Given a final visible nested row, when the pointer is within the list-panel gutter at any vertical point of the final row or within eight pixels below it, then horizontal root indentation resolves one root append. The same applies to Action, Project and Tag source kinds under their existing contracts. No separate drop region is added. Coordinates outside panel bounds, above the tree, below the bounded band, or over navigation/header/editor/popups are rejected. Mobile negative viewport coordinates are rejected.

The actual left gutter always indicates insertion rather than Into. On the final row it appends to root; on intermediate rows the upper/lower half selects before/after at the chosen depth. Inside-row title center continues to mean Into.
