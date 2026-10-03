---
change: change-20261003-tree-gutter-drop-hit
role: implementation
---

# Implementation

Trusted before-fix native matrix proved twelve cases: only inside-row bottom-edge succeeded; gutter or below-edge coordinates reached list-panel/move-status nodes, and closest(row) returned null before pure semantic resolution. The DOM adapter now supplies measured visible row geometry and bounded panel extent to a closed pure hit function. Pure hit selects a row by coordinates; existing resolve preserves the original typed movement semantics. Header/navigation/editor/popup exclusion remains an adapter observation. Native and pointer/touch pipelines use the same function. No backend or write/recovery path changed.

Independent center-left evidence exposed a second missing case: geometric row hit reached resolve, but its vertical center still returned Into before horizontal outdent. The final correction treats actual x < row.left as insertion for the whole row, with final-row root append and intermediate half-based before/after. The title center contract is preserved.
