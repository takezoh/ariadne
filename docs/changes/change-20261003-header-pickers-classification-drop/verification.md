---
change: change-20261003-header-pickers-classification-drop
role: verification
---

# Verification

Targeted UI suite passed 102 tests with zero failures, cancellations, skips or TODOs. Coverage includes header/control placement, removal of standalone creation controls, UUID-based fuzzy search, normalization/tie stability, chips/combobox association, native pointercancel one-operation handling, exact batch classification recovery, selected ancestor/child membership and earlier own-proposal flushing.

Real Chromium before/after reproduction records exact destination UUID and placement, not only write count. Clean and dirty-title-drag paths now both issue one Into request to Gamma. Root header browser passed narrow/full reachability and overflow checks; root native catalog-drop browser passed Project, Tag and Unassigned without changing containment. Independent picker creation/recovery browser passed raw IME and newer classification preservation, including clicking Check/Retry while the Tag picker remains open.

Final root integration passed: pnpm check reported 285 passing tests with zero failures, cancellations, skips or TODOs, including lint and typecheck; pnpm build exited successfully. Built-resource smoke passed both normal and verification resources. Fresh read-only Web preview passed at 390 and 1280 pixels, with sticky header and dropdown controls inside the viewport and no JavaScript errors. Independent UI, backend and picker recovery reviews approved the final candidate. Logs and redacted preview evidence are retained in evidence/.

Machine Git ingestion remains UNKNOWN; no manual Git scope-check acceptance is claimed. Hosted D1, ChatGPT Work, deployment and development-loop kernel acceptance are not claimed.
