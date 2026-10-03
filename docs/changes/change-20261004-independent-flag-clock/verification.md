---
change: change-20261004-independent-flag-clock
role: verification
---

# Verification

Targeted named DOM regression: one passed, zero failed/skipped/TODO. Targeted pure clock regression: one passed, zero failed/skipped/TODO. These are focused runs, not the complete suites.

Isolated Chromium with the real application/domain and memory store passed six width/theme combinations (320, 390 and 1280; light/dark). Assertions cover distinct Flag geometry/orange state/one write, one-character mask, Refresh preservation, sequential six digits, partial fifth digit and trailing Backspace, exact pasted milliseconds and malformed middle deletion retention. Evidence is under [evidence](evidence/).

Parent pnpm check passed: 337 tests, zero failures/cancelled/skipped/TODO; lint and typecheck passed. Final build exited 0. Both built UI resources passed. Fresh local preview read-only acceptance passed at 320, 390 and 1280 pixels: separate Flag boundary, persistent clock guide, no overflow or JavaScript errors. Seven final source hashes matched the reviewed candidate. Independent native final review approved with no findings (reviewer-verdict.json): six responsive theme layouts and progressive sequential editing. The isolated fixture does not prove hosted D1 or ChatGPT UI acceptance.
