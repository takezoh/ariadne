---
change: change-20261003-direct-action-movement
role: implementation
---

# Implementation

Pure closed movement helpers own canonical selection, ancestor deduplication, full-structure validity and relevant structural fingerprints. The backend action_move planner owns relative-anchor calculation and destination ranks, preserves source gaps, and changes only actual parent/order differences. Existing atomic store delta, owner CAS, receipt and Undo are reused; no migration or new storage API.

Versioned Project/tag desired values extend existing Action-bound proposals. Ordinary action_project/action_tag operations run through the autosave lane; value acknowledgment retains newer choices and external overlap requires inline reconciliation. Movement enters the same owner-wide lane after relevant flush; definite rejected movement retains an inline renewed-destination intent, while unknown pauses persistence with frozen exact arguments.

Pointer geometry/timers/scrolling stay in the DOM adapter. Keyboard and touch Move chooser use the same pure movement intent. All rendered user strings use safe text nodes; serialized resource factories remain closed. Older change packages and raw user text are preserved. Native Profile artifacts do not assert development-loop kernel execution.

Local implementation and integration acceptance are complete. Escape and Cancel restore focus to the originating grip after list rerender, with visible Move control fallback when that origin is unavailable. All source edits are frozen; final evidence and limitations are recorded in verification.md.
