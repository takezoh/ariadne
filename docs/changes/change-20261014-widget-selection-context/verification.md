---
change: change-20261014-widget-selection-context
role: verification
---

<!-- lifecycle is owned by change.md -->

# Verification

## Verification record

The focused `pnpm test:ui` suite passed 225/225. `pnpm check` passed lint,
typecheck, and all 474 tests with zero failures, skips, cancellations, or TODOs.
`pnpm build` passed under the portable execution profile.

`pnpm test:ui:built` passed for both UI resources from the locally started
Worker. The owned `pnpm start` process reported Wrangler 4.92.0, a local
`env.DB` D1 binding (`site-creator-d1`), and `Ready on
http://127.0.0.1:8787`; the harness received two `/mcp` responses with status
200. The Worker was stopped with Ctrl-C after the smoke test. A second short
`pnpm start` lifecycle fetched the exact resources for identity hashing and
was also stopped after two successful reads.

Source and artifact identity:

- Baseline source commit: `230fb32d3c80448673e4e69d16a496f75cfb026e`.
- A fresh dev-evidence snapshot built from that baseline and the final dirty
  tree observed 28 changed paths.
- Built Worker `dist/server/BUILD_ID`:
  `6624f5f9-a7e2-4771-ae36-25361c994f30`.
- `dist/server/index.js` SHA-256:
  `a0c0a797e06fb9552d98e0d621ff296557789f5b0a2c0260e1dae19e6c0d9e9e`.
- Compiled MCP route chunk `dist/server/_next/static/route-Zw5Vz5xC.js` SHA-256:
  `778e3236345329f9e533ced4a39cb82bce7cf84048faf1e22b15a5cca99bf78e`.
- `ui://action-tools/actions-v4.html`: 205006 bytes, SHA-256
  `b5f86ba894c7c2446c68fb08f96e7f3eb480ad074d8e3da6be42b541c91597c1`.
- `ui://action-tools/actions-verification-v4.html`: 205165 bytes, SHA-256
  `d23743a7625cfe6c916b96da9e917edcbaf386fc38c01d55b05e55ef5b12096c`.

`docs lint` passed with 68 indexed documents and no warnings. The refreshed
dev-evidence snapshot returned PASS for `out-of-scope-changes.v2` and
`closure.evidence-readiness.v1`; source scope was machine-checkable. Its
separate `unowned-sources.v2` query reported the in-scope smoke harness at
`scripts/testing/smoke-built-widget.mjs`, which is a test helper outside the
`tests/` path heuristic.

This local Worker and controlled host harness do not verify ChatGPT Work tool
discovery, caller-to-widget routing, or actual host execution. Those remain
unverified and require host retrieval evidence.

## Main integration verification

Before publication, the working branch incorporated main commit
`f4929c76fe33eda91f9d762da27de2ccbe587936` (host safe-area layout). Conflicts
in the DOM lifecycle, DOM tests and harness documentation were resolved by
preserving both safe-area handling and the widget-local selection tool.

The integrated source passed `pnpm check`: lint, typecheck and 476 tests with
zero failures, cancellations, skips or TODOs. `pnpm build` also passed. An
owned `pnpm start --port 8794` lifecycle served both built UI resources to
`pnpm test:ui:built http://127.0.0.1:8794`, and both checks passed. The Worker
was stopped with SIGINT after verification. This remains controlled-host
local acceptance, not deployment or actual ChatGPT Work acceptance.
