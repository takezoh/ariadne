---
change: change-20261003-display-checkboxes
role: requirements
---

# Requirements

Projects, Tags and Flagged show independent Active, On hold, Completed and Dropped checks, defaulting to Active and On hold. Deferred is an inclusive check: off excludes deferred Actions; on includes them within checked statuses. History independently checks Completed and Dropped, defaulting to both. No checked status means no Actions. Catalog headers remain visible. Inbox remains unfinished/unassigned including deferred; saved Perspectives apply their exact definitions.

Given an open display popup, when multiple checks are clicked or activated with Space or Enter, then the popup and checkbox focus remain, the matching list/tree updates, and no persistence write occurs. Each view remembers cloned settings. Given Active is unchecked, blank Action Add is disabled without explanatory instructions or a silent filter change.

Creation hint DOM and aria-describedby are absent. Ordinary filter summaries and combination labels are absent; unavailable selections remain distinguishable. Existing drafts, original-node IME input, unknown exact requests, catalog creation and tree gutter dragging remain intact.
