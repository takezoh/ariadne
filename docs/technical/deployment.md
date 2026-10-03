# Development, deployment and operations

Updated: 2026-10-03. See [development](../development.md), [architecture](../../ARCHITECTURE.md) and [testing](testing.md).

## Deployment boundary

Deploying Ariadne publishes its data tools and shared UI. User prompts, dot and caller-side schedulers determine management workflows and execution timing. Choosing GTD, collecting Slack/email inputs through a caller's tools or scheduling reads does not require a new Ariadne deployment when existing operations suffice. Host access and caller execution must be verified in their own environment; an Ariadne release does not install or prove those workflows.

## Local execution

Use Node.js >=22.13 and pnpm@11.25.0 with the frozen lockfile. Do not change dependency versions without a relevant requirement.

```sh
pnpm install --frozen-lockfile
pnpm check
pnpm build
pnpm db:migrate:local
pnpm start
```

Local migration reads built dist/server/wrangler.json, so build first. It accepts no arguments and uses --local with .wrangler/state; it cannot switch to hosted D1. start runs the built Worker locally. pnpm dev uses the ordinary preview wrapper. Without .sites-runtime/execution-profile.json the checkout is portable (vinext, port 5173); managed-linux uses its validated Vite build path. [execution-profile](../../scripts/execution-profile.mjs) and [run-framework](../../scripts/run-framework.mjs) own selection. Local settings are not source artifacts.

Portable mock authentication and local storage do not establish production authentication or user isolation. pnpm test:ui:built retrieves built resources and exercises a mock host, not actual Work behavior.

## Hosted target and migration 0009

[hosting.json](../../.openai/hosting.json) identifies the existing Sites project and DB binding. Preserve both and the private user-only access scope; do not create duplicate Sites/Plugins. R2 is unused. GitHub development source and Sites-managed source are separate; a GitHub push alone is not deployment.

0000 through 0008 remain unchanged. [0009](../../drizzle/0009_action_model.sql) deliberately resets authorized disposable test data for all owners, including projects, tags, reservations and receipts. It removes tasks/task_tags/dependencies and creates empty actions/action_tags. This is not a data-preserving migration. Do not run it against a DB containing valuable data without a new migration plan.

For a requested deployment, stop old writes, apply 0009 and switch to the new Worker in one coordinated cutover. Old code cannot run on the new tables; there is no old-name API alias, data fallback, receipt replay or Undo across the reset. Reload clients/tools/resources and use fresh operation IDs after the cutover. Do not silently repeat an old unknown request as a fresh save. SQL rollback and Worker rollback are separate; there is no generic reverse migration.

## Additive perspective migration 0010

[0010](../../drizzle/0010_ambiguous_umar.sql) creates owner-scoped perspective storage only. Unlike historical 0009, it does not reset existing data or receipts. Determine the target DB's applied migrations first; do not rerun the action-model reset for a perspective upgrade. Apply pending migrations before switching to a Worker that reads perspectives, since that Worker requires the new table. Preserve the existing Site, DB binding and private scope. Implementing or testing this migration locally is not evidence of hosted rollout.

## Release procedure

1. Complete code validation and identify current Site, access scope, DB and migration state.
2. Update the exact Sites-managed source using its standard workflow. Keep transient credentials out of files, URLs, logs and documentation.
3. Build the artifact from that exact source commit, locally or using the same commit in remote build.
4. Publish its version and observe terminal deployment status. Re-publishing an existing version should use that version.
5. Retrieve actual host tool definitions/resources, verify caches and accept the changed behavior in conversation and dedicated UI.
6. Record GitHub commit, Sites source commit, artifact/version/deployment, timestamp, scope and host results together.

Source updates, artifact creation, published deployment and host acceptance are separate facts. Editing skills/action-tools/SKILL.md does not mean it was installed on the host.

## Failure recovery

| Situation | Response |
| --- | --- |
| Missing write response | Preserve exact name/ID/arguments; inspect receipt or resend identically |
| Revision conflict | Keep proposal, reread, compare and review a new operation |
| Undo conflict | Preserve later corrections; do not guess an inverse edit |
| Stale UI/tools | Verify connection and actual resources; protect unsaved proposals |
| D1 unavailable | Do not claim success or definite failure for unknown outcomes |
| Deployment failed | Record failure and exact source/version; identify the last successful version |

Logs should contain generic infrastructure errors rather than action text, personal information or credentials. There is no dedicated monitoring/alert system yet.

[Previous deployment evidence](../evidence/20261003-final-deployment.json) and [Work acceptance](../note/note-20261002-work-benefit-acceptance.md) describe the pre-action-model version. Rechecking them with node docs/note/evidence/verify-work-regression-20261003.mjs verifies recorded evidence integrity, not a new host test.

Calendar sync, notifications, external arrival observation and background execution remain unsupported. Defer expiry appears on the next read; arrival needs the user's report. General availability, pricing, exports, account deletion and backup/restore UI remain separate work.

## Additive description migration 0011

[0011](../../drizzle/0011_catalog_descriptions.sql) adds empty descriptions to existing projects, tags and perspectives without resetting data or receipts. Apply pending migrations before switching to a Worker that selects these columns. Do not rerun 0009 as a description upgrade. Dedicated editing UI and hosted rollout are separate work.

## Revision guard migration 0012 and generic identifiers

[0012](../../drizzle/0012_generic_revision_guard.sql) recreates the operations revision guard with the generic `revision_conflict` marker. It changes no records, revisions or receipts. The Worker classifies conflicts by that marker, which the earlier trigger message also contains, so the order of migration and Worker switch does not misclassify conflicts.

Published tool names and UI resource URIs are generic: open_actions, list_actions, add_action, rename_action and open_verification, with resources under ui://action-tools/. No aliases exist for earlier names. Before switching, resolve outstanding unknown outcomes of the earlier add and rename tools with operation_status or a current read: receipts bind the tool name, so an identical resend under the new name is rejected and the earlier name is unknown. After deployment, confirm that the host refetches tools and resources, and update caller prompts that name tools. The hosted plugin listing name is configured outside the repository.
