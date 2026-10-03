---
change: change-20261004-independent-flag-clock
role: implementation
---

# Implementation

The Flag button is a sibling of the four-button status group. Clock tail presentation is projected by the pure date-input model; the DOM adapter renders it with textContent in an aria-hidden, pointer-transparent overlay. The underlying input retains accessible text, native selection and caret behavior. Numeric separator normalization maps the existing selection into the updated text.

Source ownership is limited to lib/widget.ts, lib/ui/adapters/dom.js, lib/ui/model/date-input.ts, tests/ui/dom.test.mjs, tests/ui/date-input.test.mjs and scripts/testing/smoke-built-widget.mjs.

Native implementation performed directly. No development-loop kernel receipt, hosted acceptance or Git preflight is claimed.
