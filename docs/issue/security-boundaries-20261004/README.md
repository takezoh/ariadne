# Security-boundary issue attachments

Date: 2026-10-04 (Asia/Tokyo).
Status: proposal and reference material; no runtime implementation or deployment.

## Materials

- [Architecture and implementation proposal](proposal.md): separate Local/public and Remote/private MCP capabilities; authentication before dispatch; owner-bound services/stores; restricted SQL construction; shared guards; CI rules; migration sequence and acceptance gates.
- [Primary references and source map](references.md): verified specification links, baseline-specific code references, file identity checks and evidence limitations.
- [Historical review report and reproduction bundle](ariadne-auth-sql-review-with-report.zip): original report and scripts, preserved unchanged. The report is Japanese; newly authored proposal/reference documents follow the repository's English documentation convention.

Current code baseline: `8df525bdf82a203b138425b6fdb9675a647d7e1b`.
Historical evidence baseline: `f8142c6490314fc3723d97bac62a1323d6aa7570`.

## Historical archive integrity and contents

Archive: `ariadne-auth-sql-review-with-report.zip`
Bytes: `15132`
SHA-256: `174d5bd7007a2ea0edb85a7b706a1886e2e02bdcdacaa992d8d2e7d31c8a29c5`
Git blob SHA-1: `0c52b79598d9671da01e5d08ca6bde566745df60`

Contents:

```text
ariadne-auth-sql-review-20261004.md
README.md
reproduce_auth.cjs
reproduce_sql.py
auth-results.json
sql-results.json
SHA256SUMS.txt
```

The archive's statement that its review did not write to GitHub describes the original review run. This attachment commit publishes that historical artifact; it does not claim new tests or production acceptance.

## Interpretation

No exploitable SQL injection is established in the inspected adapter. This proposal addresses maintaining security during future development. A new ORM or a TypeScript brand alone does not guarantee authorization. Distinguish an architectural requirement, source inspection, isolated reproduction, actual Worker D1 integration and hosted acceptance.

Do not merge these proposed behaviors into current-state documentation as already implemented. Preserve the selected Site, DB binding, private audience and existing records. The issue is not authorization for a deployment, data reset, new identity provider or broader sharing.
