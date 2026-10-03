---
change: change-20261003-display-checkboxes
role: implementation
---

# Implementation

The pure navigation model owns lifecycle arrays, Deferred inclusion, per-view memory and checkbox toggles. Model selection and remembered settings clone arrays. Both ordinary list and catalog outline use the same effective statuses/Deferred projection. Old Defer/history combination enums are removed.

The DOM adapter binds data-display-choice buttons with menuitemcheckbox semantics, keeps the popup open while toggling, and handles Space/Enter once. These selectors are distinct from mutation status controls. HTML removes creationHint and its description relationship; scopeSummary stays hidden; the existing empty-state message distinguishes unavailable selections. Built artifact smoke checks require the absent hint.

No API, database, dependency or host changes. Native implementation is distinct from a kernel run. Machine Git evidence ingestion is UNKNOWN; no machine scope acceptance is claimed.
