---
change: change-20261003-display-checkboxes
role: verification
---

# Verification

Target verification covers every lifecycle subset with Deferred inclusion, History none/both, cloned per-view memory, fixed Inbox/exact Perspective semantics, empty catalog trees, checkbox keyboard/focus, no writes and instruction removal. Existing UI recovery, IME and tree dragging regression suites are retained.

Target UI verification passed 117 tests with zero failure, cancellation, skip or TODO; target lint and typecheck passed. See [UI log](evidence/ui-tests.log), [lint](evidence/lint.log), [typecheck](evidence/typecheck.log), and the [native independent UI verdict](evidence/ui-verdict.json). Root full check passed 308 tests with zero failure, cancellation, skip or TODO, including lint/typecheck; [full check](evidence/check.log). Root [build](evidence/build.log) exited zero. Both built UI resources passed [built smoke](evidence/built.log). Fresh actual preview read-only checks passed at 320/390/1280 with zero JS errors, independent checkboxes, persistent open menu, exact empty selection, retained catalog tree, per-view memory and absent instruction/combination copy: [live browser](evidence/live-browser.json). Actual served HTML was evaluated through isolated memory-backed real actionCall/store ports; 12 trusted native mouse cases passed at 390/1280 across Action/Project/Tag gutter-center and final +8px, asserting exact root end and one write while preserving classification: [drag evidence](evidence/drag-browser.json). Actual local preview data was not mutated. The [projection browser](evidence/projection-browser.json) checks all independent lifecycle choices against populated Completed/Dropped fixtures without writes. [Retention browser](evidence/retention-browser.json) verifies Action IME, instrumented partial-date raw values, unknown check/retry and newer drafts across repeated toggles. Native independent UI review is approved and its 39 source/test hashes match the frozen candidate.

[Native persistence/recovery review](evidence/independent-verdict.json) is approved: 53 browser scenarios, seven pure assertions and 12 native drag cases. [Document conformance](evidence/docs-conformance-final.log) succeeded with 54 indexed documents and no warnings; [local references](evidence/local-reference-check.json) checked 14 links with no missing targets.

Local acceptance is complete. Fake ports and local preview do not prove hosted D1 or ChatGPT Work acceptance; no hosted deployment is performed. Native Profiles were used; the development-loop kernel was not executed. Machine Git scope ingestion remains UNKNOWN and no machine scope acceptance is claimed.
