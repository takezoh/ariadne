---
change: change-20261003-action-detail-refinement
role: implementation
---

# Implementation

Pure dateInput pair/editPair functions coordinate one deferUntil proposal through the existing strict local-time resolver. Per-Action raw pairs remain in the DOM adapter; effect formatting remains injected. Existing backend date and UTC contracts are unchanged.

Pure saveStatus projection aggregates every draft/error/conflict namespace plus local raw/IME/creation state. The controller exposes saving only around actual write calls. Scoped operationError records survive unrelated successful edits and clear on matched confirmed recovery or explicit catalog-creation cancellation. Footer errors remain visible even after unrelated success.

HTML uses semantic always-visible sections, a grouped Flag button and one animated header status icon. Actual error/unknown controls and comparisons remain. No API, database, dependency or deployment changes. Native implementation is distinct from kernel execution; machine Git evidence ingestion remains UNKNOWN.
