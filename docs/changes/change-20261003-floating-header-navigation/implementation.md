---
change: change-20261003-floating-header-navigation
role: implementation
---

# Implementation

Header composition relocates the current function heading/count into a navigation trigger and removes duplicate sidebar/select controls. Header display choices are menu-item radios with checked SVG markers; original small line icons remain consistent. A new filter icon and tick path use the existing icon renderer. The shell uses the freed sidebar width.

DOM adapters keep navigation/filter meaning in the existing pure navigation model. Popups implement roving tabindex, selected focus, disabled-option skipping, outside close, Escape and Tab exit. Menu activation restores the relevant header trigger. Perspective refresh retains exact identity and focus keys.

Header catalog creation captures kind/parent before navigation and uses the existing serial get-or-create path. Inline composer appears in the list; catalog drafts and Action drafts remain unchanged. Both composition-end handlers drain deferred creation after original target capture, and newer explicit navigation cancels it. Existing catalog submission/navigation/token guards preserve unknown outcomes and newer input.

No backend or storage changes are required. Native Profiles execute directly; development-loop kernel acceptance is not claimed.
