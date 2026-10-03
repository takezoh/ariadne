---
change: change-20261003-floating-header-navigation
role: requirements
---

# Requirements

The header shows the exact current function name and icon. Its floating navigation menu contains Inbox, Projects, Tags, Flagged, History and exact saved Perspective names; unavailable selected references remain unavailable rather than silently broadening. The sidebar and mobile scope selector are absent. Contextual Defer and History display choices preserve their existing filter semantics and selected state, with visible check icons. Refresh is icon-only with an accessible label.

Add Action preserves current targeting. Add Project or Tag captures same-kind selected parent context, switches to the matching full tree while preserving that view filter preference, safely closes the inspector and focuses an inline name input. Cancel creates nothing. Action and catalog IME defer this transition until final original-field input is captured; later explicit navigation cancels obsolete pending creation. Exact unknown recovery never discards newer text or returns to old navigation.

Menu keyboard arrows/Home/End move focus, Enter activates, Escape restores trigger focus and Tab exits. Overlays remain within narrow/full light/dark viewports and sticky header controls remain reachable. Existing native gutter drag and draft/calendar/association contracts remain unchanged.
