---
change: change-20261004-independent-flag-clock
role: requirements
---

# Requirements

The four mutually exclusive lifecycle controls form one bordered group. Flag is an independent icon toggle to its right, with its own border, a 16px gap and orange selected state.

Due and Defer retain their existing accessible 24-hour text input. Missing trailing clock segments remain visible after one character. Progressive numeric entry supplies separators without inventing missing digits or saving partial values. Refresh preserves partial proposals. Pasted seconds/milliseconds and native caret editing remain available.

Malformed middle edits retain the exact text and nearby validation; the helper does not promise a complete segmented mask for malformed input. No backend, storage or Refresh behavior changes are included.
