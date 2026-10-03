---
change: change-20261003-inbox-task-model
role: implementation
---

# Implementation Contract

A Task stores title, notes, status, parent/Project references, Due/Defer, revision, and timestamps. Remove independent captures and `manual_wait`/`source_capture_id`. New `capture_intent` accepts title and text, creates a regular task, and returns its ID in `resolved.tasks`. A title is an arbitrary ordinary string, not a classification key.

The first ref in `structure_create` edits the specified task and preserves existing notes when notes are omitted. Other refs create new tasks, saved atomically with dependencies/parent relationships. Inbox membership is not an edit authorization condition.

Expose all four status values through edit/status. Operations such as complete/cancel are compatibility conveniences. Defer stores `until`; `is_deferred` is derived from a future `until` on the task or an ancestor. Reaching the date does not update stored values. Ordinary attribute edits do not change unrelated status or dates.

Dropped records remain valid relationship targets, so relationships can be kept and those records can be edited, reassigned, or have their status restored. Prerequisite waiting considers only prerequisites in open/waiting; done/cancelled tasks are not incomplete. Completing a parent applies to all descendants, and a child can later be reopened or edited even when its parent is complete.

## Migration 0006

Move pending captures and applied captures with no references into regular tasks using the same IDs. Since legacy captures have no title, use the first 100 code points of the original text as the display title only during migration, and preserve the full text in notes. Append referenced source text to existing notes, without duplicating it when the full text already matches. Append the `manual_wait` reason to notes and move only open tasks to waiting. Preserve done/cancelled. Do not create or modify Tags. Before destructive changes, reject ID collisions, notes exceeding the UTF-16 limit, and NUL characters in combined notes. Preserve existing receipts. Since the old Worker and new schema cannot be used together, coordinate the migration and Worker at release.

Explicitly reject Undo for legacy capture deltas, `manual_wait` changes, and timezone settings; omit retired columns when comparing old deltas for regular tasks. Validate revisions for later corrections.

## Thin-Boundary Audit

Remove Inbox-only structuring, open↔waiting-only operations, mandatory removal of all relationships on drop, edit prohibition for cancelled tasks, rejection of child Defer removal while a parent is deferred, parent-first ref ordering, and the unsupported 100-delta limit. Retain the input byte limit as a technical execution-boundary constraint. Keep authentication, types, references, cycle checks, atomicity, revisions, retries, and Undo conflict handling as storage responsibilities.

Resolving date input to 09:00 and explicitly reopening ancestors are existing C3/compatibility conveniences; UTC attribute editing does not require those procedures. Preview calculates impact and does not reserve state or approve server-side semantic decisions.
