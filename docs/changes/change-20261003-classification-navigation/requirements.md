---
change: change-20261003-classification-navigation
role: requirements
---

# Requirements

The user approved Inbox, Projects, Tags, Flagged and History as the primary entrances, with saved Perspectives in a separate section. Open/normal, On hold and Later are not separate top-level destinations. On hold remains unfinished and appears in its matching base view with a readable pause icon and label, not a disabled or unavailable appearance.

Projects and Tags expose exact classification choices and an explicit Include descendants control. Unassigned and Untagged remain discoverable. The default unfinished view includes active and on-hold; Defer is visibly independent with Not deferred, Any Defer and Deferred choices. Inbox keeps its authoritative include-deferred contract. Parent action membership is never inherited.

History gathers completed and dropped records without merging their lifecycle state. Its All/Completed/Dropped choices filter only. Saved Perspectives use their exact filter definitions, name and description, preserving action order and one row per action; no hidden unfinished or Defer filter is applied. Creating/editing/deleting classifications or perspectives is outside scope.

## Acceptance and counterexamples

- Given matching active and on-hold actions, selecting their Project/Tag shows both with the current explicit Defer filter. Counterexample: a hidden available/active-only filter removes the on-hold action.
- Given a selected Project/Tag, its exact membership matches until Include descendants is explicitly enabled. Counterexample: child classifications or child actions inherit membership automatically.
- Given an action with multiple matching tags, it appears once in saved action order. Counterexample: grouping duplicates it or inserts a nonmatching parent.
- Given a saved Perspective with no statuses field, all statuses remain eligible; statuses:[] matches none. Counterexample: an implicit unfinished constraint narrows either result.
- Given completed and dropped records, History All shows both with distinct statuses. Counterexample: Dropped becomes Completed or records are deleted.
- Given a selected classification/perspective becomes unavailable, the selection remains unavailable with zero matches. Counterexample: the UI silently falls back to All.
- Given any of nine unsaved fields, capture text or an exact unknown request, navigation and display changes keep it accessible. Counterexample: a filtered-out action is treated as deleted or retry changes the original write arguments.
- Given an unknown save, navigation and Back/Close still work while mutations stay blocked. Counterexample: recovery requires abandoning the proposal.

All authored UI is English; user material is exact. Wide layouts retain selected-only inspector. Narrow layouts use the view selector, contextual classification picker, action list and focused detail/Back. Quick creation explicitly adds to Inbox regardless of the selected classification.

See [native design candidate](evidence/design.json), [independent design review](evidence/design-verdict.json) and [exploration](evidence/requirements-explore.json). OmniFocus is an information-architecture reference only; no sequential execution, project status, inherited Flag or recommendation policy is introduced.
