---
change: change-20261003-refined-action-input
role: requirements
---

# Requirements

Given visible actions A/B/C/D, clicking A then Shift-clicking C selects exactly A/B/C; Shift-clicking B shrinks to A/B. Plain or Ctrl/Cmd click replaces the selection with one action. No row selection checkbox is shown. Selection never silently extends to hidden actions.

Dragging a title or row past six pixels moves its selected contiguous bundle, or that single row when it is outside the selection. A click below threshold still opens the action. Flag/completion controls do not initiate dragging. Touch scrolling remains normal outside the dedicated grip; the grip and keyboard Move chooser share the same pure intent. The first intentional click after drag is not suppressed.

Due uses a native date/time picker and explicit client timezone display. Defer supports a date picker with local 09:00 resolution and a date/time picker resolving to an instant. Empty inputs explicitly clear. Invalid, DST-ambiguous and nonexistent local times never invent an instant and retain an action-bound invalid proposal. Saved instant milliseconds survive display/edit round trips; render and timezone changes never write.

Projects and Tags expose New controls in navigation and selected-action detail. Inline name creation uses existing get-or-create behavior. A response lost after creation retains exact operation arguments and generated result identity. Creation and optional action assignment are separate serial writes. Later action classification, composer name or navigation input is preserved; earlier creation never restores its older selection over that input. No Save or Review modal is introduced.
