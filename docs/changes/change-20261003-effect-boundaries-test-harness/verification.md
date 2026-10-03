---
change: change-20261003-effect-boundaries-test-harness
role: verification
---

# Verification record

Before the structural change, the existing 22 persistence checks, 5 UI checks, typecheck and lint passed.

Independent review found and the implementation fixed:

- A render exception after discarding a UI proposal when draft was not replenished. Now restore from latest saved value while preserving other drafts.
- Busy/unknown-outcome controls not being reapplied after DOM regeneration. Apply after render and guard changes in the controller too.
- A path treating invalid/missing save responses as success and losing the request. Treat as unknown outcome and retain the exact request.
- Harness reporting exit 0 for empty or skip-only test files. Reject through structured per-file/overall summaries and verify with real child processes.
- New UI application missing from lint scope. Add it to pure-effects and dependency-direction rules.

Final independent review verdict: approved. Review also found/fixed a busy guard regression after discarding a proposal; reran 22 UI and 12 harness checks.

Local final checks on 2026-10-03 (JST):

| Check | Result |
| --- | --- |
| `corepack pnpm check` (Node 24.15) | 0 lint warnings; typecheck and all 83 tests passed. 0 fail/cancel/skip/TODO. |
| Shared test runner on Node 22.23.2 | All 83 tests passed. 0 fail/cancel/skip/TODO. |
| `corepack pnpm build` | All five Worker build stages succeeded from final source. |
| `corepack pnpm start` → `corepack pnpm test:ui:built` | Retrieved regular/acceptance MCP resources from the built Worker; used JSDOM and mock host to check save response, lost response and identical retry. Both resources passed. |
| Targeted ESLint for added artifact verification script | Passed with 0 warnings. |
| `git diff --check` | Passed. No lockfile or migration changes. |
| Isolated docs lint/conformance for added change/design/issue | Passed with the same schema/CLI. Does not mean the whole repository passed. |

Child-process tests also found that Node's test-runner `NODE_TEST_CONTEXT` was inherited by child runners. Removed it from the child environment and verified rejection of empty/skip-only tests and success for a normal test.

Production D1, Sites authentication injection and ChatGPT Work device behavior were not retested. Adding a GitHub Actions workflow records its creation; it does not mean remote CI ran or branch protection was configured.

Repository-wide `dev-docs lint` failed on missing frontmatter in the pre-existing `note-20261002-sidebar-entrypoint.md` and `note-20261002-work-benefit-acceptance.md`. The change package was checked in isolation with the same schema/CLI; do not treat that as repository-wide lint success or formal closure.

## Documentation checks repaired before commit

On 2026-10-03, following the commit hook, generated frontmatter for the two existing notes through the CLI and appended it while preserving their bodies byte for byte. The user explicitly approved a three-line metadata-only repair to closure metadata for the earlier completed MVP change, and the approved patch was applied. `closed_at` seals that historical metadata at repair time; it is not the time past device acceptance was rerun. Ordinary repository-wide docs lint passed.

Repository-wide `lint --conformance` still reports missing verification `evidence_refs` / explicit promotion in the earlier MVP and duplicate `skills/action-tools/SKILL.md` ownership in two existing designs. Distinguish successful app verification from conformance of all docs or formal closure.
