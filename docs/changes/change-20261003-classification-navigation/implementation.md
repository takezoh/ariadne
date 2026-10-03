---
change: change-20261003-classification-navigation
role: implementation
---

# Implementation

A closed typed pure navigation factory reads the full authoritative API snapshot. Classification matching uses direct project IDs and direct projected tag IDs; optional descendant expansion follows the selected catalog hierarchy. Filtering preserves the full snapshot action order and returns each action once. Saved definitions use exact AND predicates, including false values, project_id:null and the difference between missing and empty status arrays. Read-time Defer is taken from the authoritative projected snapshot.

No partial query response enters the controller or replaces its full action collection. Each destination keeps its own selected classification/perspective, Defer and descendant controls and History status. Returning restores those choices; missing IDs remain unavailable. Refresh and host snapshots recompute navigation while preserving selected IDs. Missing selections and missing saved references fail closed with explicit English feedback.

The shared widget exposes five primary views and exact-name Perspectives. Contextual classification, descendant, Defer and History selectors display their scope. Project/Tag metadata appears in rows and details. On hold uses pause icon plus readable label and retains ordinary action controls. Back/Close are navigation rather than mutations and remain available during unknown writes. Quick-add labels explicitly identify Inbox.

The existing draft controller, all nine fields, per-group acknowledgment, IME/caret, original capture text, preview review, revision, exact request recovery and Undo semantics remain. No backend, schema, storage, infrastructure, dependency, catalog management or deployment change is included. The current architecture/data/API references are updated to state that saved Perspective browsing exists while CRUD controls remain outside scope.

Native implementation and all local integration gates are complete. Independent requirements/design/implementation approval, final 228-test check, build, both built resources and actual local Web preview results are recorded in [verification](verification.md). No hosted deployment or runtime-kernel completion is claimed.
