---
change: change-20261003-tree-gutter-drop-hit
role: verification
---

# Verification

Permanent pure and DOM tests passed 30 cases with zero failures, cancellations, skips or TODOs. Regression exercises elementFromPoint returning list-panel, exact root operation payload, and navigation/editor/outside-band rejection. Final whole check passed 302 tests with zero failures, cancellations, skips or TODOs, including lint and typecheck; final build exited successfully. Independent trusted same-coordinate center-left Action/Project four cases and Tag two cases now pass exact root append and one operation, with edge and invalid-bound regressions retained. Native independent review approved the corrected source. Both final built resources passed. Fresh read-only Web preview at 390 and 1280 pixels passed with no JavaScript errors. The HTML actually served by that fresh preview was captured and exercised through isolated shared-domain memory ports: all 18 trusted native cases passed exact root parent, append rank and exactly one operation, including center and top left-gutter positions. The same-coordinate earlier served HTML reproduced one success and eleven failures in the prior 12-case edge matrix. This separates source-candidate acceptance from actually served artifact acceptance. Native Profile execution is direct; development-loop kernel, hosted D1 and ChatGPT Work acceptance are not claimed.

The initial edge-only candidate was not sufficient: independent actual center-left testing produced four failures. The corrected candidate includes permanent full-row gutter insertion tests and passed the same-coordinate final center/edge matrix; the initial failure remains recorded as the reason for the final correction.
