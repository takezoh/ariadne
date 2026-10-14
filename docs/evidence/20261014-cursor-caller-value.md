# Local cursor caller observations

Nine independently fresh native Codex callers (`gpt-6.1-sol`, low effort) operated a small synthetic river-quality memo fixture through the actual built Worker `env.DB` and local Wrangler D1. Two owners held equivalent state for incremental and full-state/client-comparison arms. Generated HTML came from real MCP `resources/read`; JSDOM forwarded its tool effects to that same Worker. This is not a physical-human study or hosted ChatGPT Work acceptance.

The [source-bound record](20261014-cursor-caller-value.json) contains source/artifact identities, exact prompt/output digests, tool choices and limitations. Raw public prompts, exact MCP requests/responses, outputs, opaque checkpoints, process/binding evidence and failures are retained externally under `/home/davinci/evidence/issue20`, with `scenario-observations.json` as the observation index. No credentials or private model reasoning were retained.

## Observed scenarios

| Scenario | Incremental caller | Full-state caller |
| --- | --- | --- |
| Actual initial context | Read the complete revision-3 snapshot and proposed a short source-figure check, referring to the saved Friday-publication plan. Its actual output and snapshot were retained. | Same objective, preference and semantic state; independently proposed the same small check and referred to Friday. |
| VALUE-1: UI correction | From its revision-3 cursor, retrieved two real operations: notes withdrew the Friday commitment and status became on-hold. Its next proposal explicitly respected both changes and focused on uncertainty. | Reread revision 5 and compared it with the prior snapshot. Its next proposal also withdrew Friday commitment and respected the hold. |
| VALUE-2: another AI's result | A separate actual model chose one atomic `edit`, saved the supplied source finding verbatim and completed only the validation child. A fresh successor retrieved the revision-6 operation and proposed drafting a caveat from that result. | The coordinator replicated that model-chosen intervention, with translated fixture IDs, through real MCP. A fresh consumer reread revision 6 and also proposed a caveat instead of repeating completed validation. |
| VALUE-3: restored context | Both resume rounds received their own earlier actual output, canonical persisted cache and cursor. The caller retained the conversation-only preference for one step under 15 minutes and no unrelated reorganization. | The paired callers received equivalent legitimate retained context and compared complete snapshots. |
| VALUE-3: context lost | Received only the terminal cursor. It first observed an empty feed, then chose `list_actions` to obtain current state. It explicitly said the cursor could not restore unsaved preferences, reasoning or agreements. | With no prior cache or conversation, reread current state and stated the same recovery limits. |

The synthetic source finding was: “Station B samples were collected after rain and cannot be directly compared with the dry-weather baseline; dry-weather confirmation is still needed.” It was test input, not an independently measured physical fact. The actual producer preserved it and the successors reflected the comparison limit rather than claiming the water was safe or publication was ready.

Final snapshots were semantically equal after fixture-ID translation: publication parent on-hold, source-validation child completed with the finding, caveat child active and the unrelated library-card action unchanged. Consumers made no business writes. Checkpoints were finalized only after public output and canonical processing succeeded; failed retrieval did not advance them. A local processed position is not evidence of human reading, Action completion or correct understanding.

## VALUE-4 comparison

Both methods succeeded on the observed correction and handoff. Neither resumed prompt repeated the correction or the other AI's result. Neither successful output retained the old Friday commitment, repeated completed validation as pending, or proposed unrelated reorganization. Both recommended a short caveat draft after the result. This supports parity in this fixture; it does not establish that incremental retrieval gives better advice or less long-term management effort.

The incremental arm exposed changed operations directly. The full-state arm compared old/current snapshots and reached comparable advice. When the cache was lost, the incremental caller needed a full snapshot as well. Actual tool choices, including an extra initial full read by the incremental caller, remain in the JSON record; fewer requests or tokens were not assumed or used as the semantic success criterion.

## Reproduce the observation path

1. Use the pinned Node/pnpm environment and frozen install. Run `pnpm check`, `pnpm build`, `pnpm db:migrate:local`, then start a dedicated `pnpm start` instance in an independent checkout. Record its process family, built configuration and local DB path. If the proxy fails, preserve that failure and discover the actual owned user-Worker listener rather than reusing a port from this report. Complete builds before launching callers: rebuilding can replace that listener.
2. Create two fresh synthetic owners and external evidence directories. Use the manifest below, replacing the port, run/owner identifiers and directory for each arm. Record these resources before writes. `prepare_fixture` refuses nonempty owners and records generated fixture IDs and the atomic baseline snapshot/cursor.
3. Give each fresh native model only the public bridge contract, its manifest and the same natural-language objective: read the shared list and suggest one step under 15 minutes, without changing state or reorganizing unrelated actions. Let it discover `tools/list` and choose its requests. Retain its actual public output and consistent cache/cursor; do not substitute a scripted proposal.
4. Use a setup manifest's `ui_intervention` on the recorded parent, with the correction and on-hold status. The command retrieves actual generated HTML, performs selection/input/blur/status DOM events and independently reads back persisted notes/status. Do not include the correction text in the next consumer prompt.
5. Launch independently fresh restored consumers. Both receive their own saved actual output/cache/cursor and the same ordinary resume objective. Configure one for incremental catch-up, allowing additional context reads; configure the other for full-state reread/client comparison. Read-only manifests prevent business writes.
6. Give another actual model the synthetic finding and authorization to save it on the validation child and complete that child only. Narrow its manifest with `writeKinds`, `writableActionIds` and `writeFields`. Record its chosen requests/results. Replicate the exact confirmed semantic intervention on the baseline owner through real MCP, with translated IDs and a distinct owner-specific operation ID; this replication is coordinator setup, not evidence of a second producer model. Resume fresh consumers from their own pre-result contexts without a separate result briefing.
7. Separately remove context/cache. Give fresh callers only their opaque terminal cursor and the request to recover a next step and explain recovery limits. Retain actual tool choices and public outputs. Assess stale assumptions, re-explanation, duplicate recommendations, lost-preference claims, invented intent and unrelated reorganization independently of the caller.
8. Finalize a checkpoint only after successful output/processing, using paths under that caller's evidence directory. Preserve failed attempts, exact unknown write IDs/arguments and old checkpoints. Capture final snapshots, stop only recorded Worker processes and retain evidence outside the disposable checkout. Do not publish runtime directories or production data.

This run used native `collaboration.spawn_agent` with `fork_turns: none` and the installed dev-skills default placement. Accepted host launch bindings identify model settings; model self-report was not used. Infrastructure-only recovery resumed the same two failed readers after fixing their endpoint. The raw experiment prompts and outputs are evidence, not a deterministic promise that every model run will produce the same words.

A setup manifest has this complete shape; its placeholders must be replaced with newly recorded local resources:

```json
{
  "schemaVersion": 1,
  "runId": "issue20-fresh-setup",
  "purpose": "Paired synthetic caller observation",
  "dataClass": "synthetic",
  "endpoint": "http://127.0.0.1:<owned-user-worker-port>/mcp",
  "ownerId": "issue20-replace-with-fresh-identifier",
  "evidenceDir": "/home/davinci/evidence/issue20/fresh-run/setup",
  "capabilities": {
    "mcpRead": true, "mcpWrite": true, "resources": true,
    "uiIntervention": true, "prepareFixture": true,
    "snapshot": true, "checkpoint": false
  },
  "permittedTools": ["list_actions", "get_changes", "get_change_cursor", "apply_change", "preview_change", "operation_status"],
  "permittedResources": ["ui://action-tools/actions-v4.html"],
  "fixtures": {"actions": [], "projects": [], "tags": [], "perspectives": []}
}
```

Run one JSON operation on stdin:

```sh
node scripts/testing/caller-value.mjs --manifest /absolute/path/setup.json < operation.json
```

Start with `{"command":"prepare_fixture"}`. Later caller manifests use separate run IDs/directories and the recorded fixture IDs. Read-only consumers disable `mcpWrite`, `uiIntervention`, `prepareFixture` and `checkpoint`, and permit only required reads. The complete operation contract and scoped producer example are in [implementation](../changes/change-20261014-cursor-caller-value/implementation.md).

## Verification and retained failures

`pnpm check` passed lint, typecheck and all 478 tests, with zero failures, cancellations, skips or TODOs. The eight focused harness tests cover endpoint/owner/identity rejection, write scope, exact request recording before a missing response, opaque checkpoint eligibility and production-shaped resource contents. `pnpm build` passed. Existing API evidence remains applicable because no product API, store or transition source changed.

The first UI attempt assumed an optional resource `type` field; the next referenced a missing helper. Both failed before a UI write. The parser was corrected against actual `{uri,mimeType,text}` data and regression-tested before the successful paired intervention. A proxy returned 503; a verified owned direct listener worked. Rebuilding later changed that listener and caused two model read failures. Their failure outputs and unadvanced checkpoints were preserved; after an owned Worker restart and unchanged-state check, the same readers completed successfully. These failures are retained, not relabeled as passes.

The implementation handoff also encountered an assignment-format error: the main session supplied glob strings to a skill that treats scope entries as literal directories. The candidate remained within the intended responsibility; its writer terminated, and source/gate evidence was preserved for independent review under concrete paths. No skill runtime or ledger was modified and no successful skill handoff is claimed for that rejected operation.

Independent final assessment approved the bounded harness and VALUE-1 through VALUE-4 observations with no findings. Parent Issue #16 retains combined API/caller acceptance. Local Wrangler D1 does not prove hosted D1 or trusted Sites header injection. Synthetic host replies/JSDOM do not prove ChatGPT Work rendering/cache behavior or physical-human acceptance. No deployment, production mutation, universal LLM guarantee or long-term human-benefit claim is included.
