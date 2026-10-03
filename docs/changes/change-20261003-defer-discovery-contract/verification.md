---
change: change-20261003-defer-discovery-contract
role: verification
---

# Verification

## Local acceptance

`pnpm check` passed: lint, typecheck and 217 tests, with no failures, skips or TODOs. `pnpm build` and `pnpm test:ui:built` passed. Independent review approved the conditional schema and the preview validation correction. [Validation record](evidence/validation.json) identifies the source hashes and gates.

The built HTTP Worker's published schemas passed [18 validator cases](evidence/schema-check.json). Actual Worker/local D1 preview calls passed [7 input cases](evidence/d1-validation.json), including mixed forms, unknown fields, missing timezone and date-only until rejection, with unchanged revision and saved state. These scripted contract checks are separate from caller behavior.

A fresh caller with no previous probe or outcome context read README, initialize, tools/list and the operation Skill. It chose calls sequentially through HTTP to the existing Worker and Wrangler local D1 binding. [Caller evidence](evidence/caller-outcomes.json) records six prompts and 32 requests, with zero initial errors or retries. Both October 8 and October 10 used date plus Asia/Tokyo on the first attempt; preview resolved to 09:00 JST and the caller saved its returned until at the same revision.

[Independent assessment](evidence/assessor-outcomes.json) reread revision 14 and checked original notes, four intended trip items, unfinished selection including on-hold/deferred, no recommendation writes, UI resource delivery, and Undo restoring October 8 while preserving other state.

## Limits

This acceptance uses local Wrangler D1, synthetic owner headers and CLI-mediated HTTP calls. It does not establish hosted D1, trusted Sites authentication or actual ChatGPT Work rendering/editing. The Skill was read explicitly, not discovered automatically by the native host. The year 2026 appears in the caller response but is not expressly labeled an inference. No hosted deployment, migration or remote data reset was performed.
