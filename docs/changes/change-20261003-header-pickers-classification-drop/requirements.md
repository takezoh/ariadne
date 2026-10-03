---
change: change-20261003-header-pickers-classification-drop
role: requirements
---

# Requirements

Primary Add in the app header creates an empty Action using the existing exact context. Its right menu offers Action, Project and Tag. Catalog selection supplies the same-kind child parent; otherwise creation is top level. Standalone New Project/New Tag and child-create buttons are removed. Defer and History Status filters also live in the responsive header and remain reachable with a narrow inspector open.

Project is a searchable single-membership combobox with Unassigned and inline New Project. Tags use removable linked chips and an Add Tag picker with existing choices and inline New Tag. Fuzzy search ignores width, case, accents and kana form while never changing raw text or identity. Stable catalog UUIDs determine selection; ties have deterministic path/ID order. Inline New pre-fills the exact user query. Keyboard arrows/Enter select, Escape closes and restores focus, and outside clicks close without losing the clicked action. IME and newer search/name input survive refresh and unknown creation recovery.

Dragging an Action title center means Into that exact Action; explicit row edge zones mean Before/After. Native HTML5 mouse, pointer and touch reuse the same frozen intent and dispatch at most one operation. Showing drag controls or feedback must not move destination rows. Catalogue header drops intentionally assign the selected Project, add the selected Tag, or clear Project on Unassigned. Other Tags, lifecycle and dates are preserved. Untagged does not silently clear all Tags.

Shift remains contiguous visible occurrence selection. Classification deduplicates UUIDs but does not absorb selected children into selected ancestors. The whole selected set commits in one atomic revision/receipt/Undo operation. Earlier proposals flush; later edits and external changes retain their original baselines. Unknown drops retain exact arguments and navigate safely without fresh duplicate operations.
