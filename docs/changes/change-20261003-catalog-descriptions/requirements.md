---
change: change-20261003-catalog-descriptions
role: requirements
---

# Requirements

When a caller creates a project, tag or perspective, Ariadne shall save the optional description exactly, defaulting to empty text. When a caller edits a description, omission shall retain it and an empty string shall clear it. Project/tag get-or-create shall not overwrite descriptions of existing matches. Invalid supplied values shall be rejected regardless of matching.

Description shall be string data of at most 65,536 UTF-16 code units. It shall not alter identity, classification, lifecycle, hierarchy or filter semantics. It shall not grant operation authority. Relevant owner-scoped read results shall expose it identically through shared HTTP/MCP operations.

All changes shall preserve atomic CAS, replay, unknown-response recovery, owner isolation and conflict-aware Undo. The migration shall preserve existing data and receipt bytes, including usable historical catalog Undo.

UI controls, deployment, remote reset, commit/push and unrelated feature changes are outside scope.
