---
change: change-20261003-classification-navigation
role: verification
---

# Verification

Targeted UI tests passed all 72 cases, with no failures, cancellations, skips or TODOs. Typecheck passed. An independent review found that switching views reset a classification selection; immutable per-view state and model/DOM regressions now preserve each selection and filter on return, including missing selections. New pure tests compare classification and saved Perspective matching to authoritative domain query/projection behavior. They cover direct/descendant membership, AND predicates, omitted/empty statuses, false predicates, unassigned records, expiry, missing references, order and deduplication. DOM tests cover exact escaped saved names/descriptions, classification/view changes preserving proposals, deleted selection failure, unknown-save navigation/Back/Close and exact original retry arguments.

Final whole-source combined check succeeded with lint, typecheck and all 228 tests passing, with zero failures, cancellations, skips or TODOs. See [combined check](evidence/check-final.log). Independent native implementation review approved the repaired candidate; see [review](evidence/implementation-verdict.json). Final build succeeded with exit code 0; see [build](evidence/build-final.log). Built-resource tests succeeded for both normal and verification UI resources; see [built checks](evidence/built-test.log). Fresh local Web preview returned HTTP 200, English language, Inbox heading, zero actions, all five primary navigation labels and no observed JavaScript errors; see [live result](evidence/live-browser.json) and [preview](evidence/live-preview.png). Local tests do not establish actual hosted D1, trusted hosted authentication, host resource caching or ChatGPT Work acceptance. No deployment is included.

Requirements, design and implementation were authored by a native subagent and independently reviewed with native agents. The standard development-loop kernel was not executed and no kernel receipt or success is claimed.


## Browser evidence

New-source real Chromium checks passed five layout/navigation runs across widths 320, 390 and 1280 in light/dark samples, and three draft/recovery runs at 320 light, 390 dark and 1280 light. See [navigation/layout results](evidence/browser.json) and [recovery results](evidence/recovery-browser.json). The checks observed no horizontal document overflow or JavaScript errors, exact Project and Tag membership, explicit descendant expansion, visible On hold, History state separation, exact Perspective definitions, retained nine-field and capture input, missing classification failure, enabled unknown-result navigation and identical retry arguments. The final candidate was rechecked after the per-view selection fix, including return to a deleted selection without broadening to All.

Screenshots under evidence show Projects, Tags, Flagged, History, Perspective, capture, review, unknown outcome and unavailable selection. Synthetic data is separate from the local database and includes exact Japanese source text; application-authored controls remain English.

## Check and scope boundaries

Earlier check/build runs were explicitly interrupted by the integrating agent with exit code 130 to apply the independent review fix. Final combined check was rerun successfully on the repaired source. Final build and built-resource verification succeeded. A previous dev process served stale imported UI content, so it was restarted. The fresh process initially timed out while cold-starting; a retry after readiness succeeded and confirmed the latest source. The local preview remains running on port 5173 for user inspection. Local Web preview acceptance is separate from actual ChatGPT Work acceptance.

The dev-evidence machine preflight is UNKNOWN/not executed because its CLI internally launches Git, conflicting with the session requirement that Git run as an approval-gated standalone host command. Manual scope review supplements this unavailable machine check: this change touches only navigation model, shared widget, DOM adapter, generated icons, initial UI view, navigation/DOM tests, current architecture/data/API references and this new package. It preserves the pre-existing uncommitted English UI changes and their package, and introduces no backend, schema, storage, dependency, infrastructure, catalog CRUD or deployment change. Manual review is not represented as a machine verdict.


## Final independent acceptance

Native independent requirements verification approved the implemented UX and recorded direct observations; see [requirements verdict](evidence/requirements-verdict.json), [assessment](evidence/requirements-assessment.json) and [observations](evidence/independent-requirements-observations.json). Design and repaired implementation also received independent native approval. Combined check, build, built resources, synthetic Chromium coverage and fresh live Web preview completed on the final source. Local implementation and validation are complete. No commit, push or deployment is included. The runtime kernel was not executed and hosted acceptance remains unverified.
