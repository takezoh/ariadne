---
change: change-20261014-cursor-caller-value
role: verification
---

## Acceptance

- Read-only manifests reject every tool classified as mutating, including `capture_intent`.
- A narrowed producer manifest permits only declared kinds, action targets and payload fields.
- Cursors from `get_change_cursor` and incomplete feed pages cannot checkpoint; full snapshots and terminal feed pages can.
- Missing responses for all mutating tools classify as unknown and retain their operation identity.
- Actual `resources/read` TextResourceContents `{uri,mimeType,text}` are accepted even without `type: "text"`.
- Local lint, typecheck, test suites and Worker build pass for this source.

## Evidence boundary

The focused unit tests use synthetic manifests and injected/structured contract values. Any actual Worker preparation or UI intervention in the external experiment directory is parent-owned and must cite its real CLI output/event files. Harness preparation is not evidence that actual consumers preserve context, change a useful state, or reduce user remembering and organization effort.

`node --test tests/harness/caller-value-bridge.test.mjs` passed 8 tests. `pnpm check` passed lint, typecheck and 478 tests with no failures, cancellations, skips or TODOs. `pnpm build` passed. `dev-docs docs lint --conformance` passed with no warnings. Current source and built Worker digests are recorded in [scenario evidence](../../evidence/20261014-cursor-caller-value.json); [preparation evidence](../../evidence/20261014-cursor-caller-value-preparation.json) retains the earlier harness-only run.

Do not put raw credentials, personal caller data or private reasoning in repository evidence. Actual model outputs, UI intervention and restored-consumer observations are recorded in the [synthetic report](../../evidence/20261014-cursor-caller-value.md) and its source-bound JSON. Independent final assessment approved the bounded contribution with no findings; see the source-bound JSON for its exact evidence reference.
