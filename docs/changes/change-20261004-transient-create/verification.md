---
change: change-20261004-transient-create
role: verification
---

# Verification

Focused new transient controller/model regressions: eight passed, zero failed/skipped/TODO. Migrated creation/application/generated-DOM regressions: ten passed, zero failed/skipped/TODO. Two local tree DOM regressions also passed (Inbox ancestry and same-view catalog parenting), with zero failures/skipped/TODO. Targeted lint and typecheck passed without warnings. These are targeted cases, not the complete suites.

Six isolated Chromium functional scenarios passed using actual actionCall/domain with a memory store: untouched navigation zero writes, Notes-only one populated creation, catalog Name-first creation with exact description, invalid Clock blocking and valid Defer after UUID remap, and unknown Check/Retry retaining the exact creation request and later Title on the same identity. The application fake separately asserts no local reference crosses transport and preserves raw text equal to a local ID.

Native independent final review approved with no remaining findings: three adversarial browser scenarios and three final tree/ancestry scenarios passed, with 21 final source hashes recorded. Parent build exited 0 and both built UI resources passed. Fresh actual preview confirmed zero persistence attempts for untouched Action/Project/Tag Add. Four additional legacy recovery harness cases were migrated to content-first creation and passed without weakening failed-refresh, exact receipt/replay or delayed-selection guarantees. Final parent pnpm check passed: 347 tests, zero failures/cancelled/skipped/TODO, lint and typecheck passed. All 21 reviewed source hashes matched. Documentation conformance passed with 59 indexed documents and no warnings; nine local references resolved. Mock ports and memory fixtures do not prove hosted D1, trusted host authentication or ChatGPT UI acceptance.

## Catalog inspector-close correction acceptance

Trusted Chromium reproduced untouched Project/Tag rows remaining after Close with zero writes. The corrected same-close path removes both untouched rows with zero writes; Description-edited rows and saved catalogs remain. Two permanent targeted regressions passed, including invalid names, transitive dependencies and unknown request preservation. Final combined check passed: 376 tests with zero failures/cancelled/skipped/TODO, lint and typecheck passed. Final build exited 0 and both built UI resources passed; fresh authenticated preview passed Action/Project/Tag repeated Add replacement and Close: one local replacement followed by zero local rows, zero mutating HTTP requests, and unchanged empty revision-0 snapshot.

## Selected temporary Add replacement acceptance

Before correction, repeated Action Add showed two local rows; editing the child still made zero persistence writes and left the authoritative snapshot unchanged. Trusted Chromium six replacement scenarios (Action/Project/Tag, untouched/edited) now retain one local row, make zero replacement writes, and commit only the final valid content once without a local parent ID. Controller/model 17 and named DOM 2 cases passed; final guards cover pending/unknown, dependency retention, explicit null parent, unavailable ancestry and catalog IME. Final combined check passed: 376 tests with zero failures/cancelled/skipped/TODO, lint and typecheck passed. Final five source hashes matched and independent review approved. Final build exited 0 and both built UI resources passed; fresh authenticated preview passed Action/Project/Tag repeated Add replacement and Close: one local replacement followed by zero local rows, zero mutating HTTP requests, and unchanged empty revision-0 snapshot.

The earlier 347-test integration describes the original change. The current required-title and explicit Add-replacement acceptance above supersedes Notes-only creation. The prior failed targeted lint and canceled build are not successful acceptance evidence; the corrected targeted lint exited 0 before the final frozen-source gates.
