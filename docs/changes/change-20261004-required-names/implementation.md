---
change: change-20261004-required-names
role: implementation
---

Changed transient eligibility to Title-only and autosave validation to nonempty/raw-max-200 Title for explicitly touched fields. Existing adjacent field feedback consumes this pure validation. Updated prior Notes-only creation fixtures and built-resource smoke to wait for Title, preserving raw Notes and replay assertions. ARCHITECTURE describes the current contract.

The independent backend Profile requires nonempty Titles and Names at changed-field/creation boundaries and preserves untouched legacy records, old receipts and Undo. Its source scope and targeted 30-test/typecheck/lint evidence are recorded separately. No DB schema or migration files changed.
