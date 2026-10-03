---
id: note-20261004-gtd-workflow-acceptance
kind: note
title: GTD-style caller workflow acceptance on local D1
status: published
created: '2026-10-04'
tags: []
owners: []
relations: []
source_paths:
- docs/usage/agent-workflows.md
- skills/action-guide/references/workflows.md
- skills/action-tools/references/operations.md
summary: Behavioral test of reusable capture, clarification, organization, review,
  user updates and method adaptation through the existing MCP Worker and D1 binding.
subject_paths:
- app/mcp/route.ts
record_type: debug-experiment
updated: '2026-10-04'
---

## Summary

The tested GTD-style caller workflow passes capture, clarification with supplied facts, organization, weekly review, authorized progress updates, and adaptation to a less structured method. Execution used LLM-selected public MCP calls over HTTP into the built Worker and its existing Wrangler local D1 binding. The test did not substitute a hand-written SQLite adapter.

Eight original inputs were preserved with stable action identities. The caller created two projects, explicit category tags and five reusable saved perspectives. It performed 49 successful writes and 121 tool calls without API errors or retries. Both reviews were read-only. A fresh caller given a reusable playbook without historical expected results independently selected the same four actionable items at revision 49, without writes.

## Scenario and observations

| Stage | Behavior verified | Result |
| --- | --- | --- |
| Capture | Eight separate inputs retain exact notes; ideas, reference material and tentative preferences do not become invented commitments | Pass |
| Clarify and organize | Explicit due dates only; committed projects get source-supported children; waiting, someday, reference and undecided remain distinct | Pass |
| Weekly review | Complete unfinished inventory and both projects inspected; focus recommendations do not change state | Pass |
| Progress updates | Reply received makes waiting item active, not completed; completing receipts leaves tax parent active; packing uses date-only Defer with Asia/Tokyo | Pass |
| Adapt method | Existing records reused; temporary less structured query selects four nondeferred actionable items, excludes reference and someday | Pass |
| Fresh-context reuse | Caller sees generic playbook and live discovery/state only; independently reviews 11 unfinished items and selects four actionable items | Pass |

The four actionable items were Sketch proposal, Pay electricity bill, Fill the form, and Book the hotel. The proposal remained undated. Packing resolved to 2026-10-10T00:00:00.000Z. The landlord item remained visible, but its concrete next action could not be inferred from an unspecified reply. Fresh review correctly requested that missing information instead of inventing a response.

The first reuse attempt had access to a playbook containing prior results. It is supplementary evidence only. The fresh blind reuse removed those results and case-specific update instructions before the new caller started. The initial caller also had a local artifact-finalization error after API execution; retained responses reconstructed the artifact. Neither issue was hidden or counted as an API success.

## Missing-information branch

A separate seventh stage captured the exact input “Deal with the bank issue.” The caller asked what the issue was and what response or outcome was decided. Before the answer, revision 50 remained unchanged and no deadline, Defer, project, tag or child was added. After the synthetic user explained a duplicate charge and authorized asking the bank to check it, the caller updated the same action to “Ask the bank to check the duplicate charge,” retaining both original concern and exact answer in notes. It added only Actionable and Next action tags. It did not invent a dispute, refund or deadline. Independent live readback at revision 53 matched the final action and confirmed the earlier 12 actions were unchanged. This branch made four successful writes, moving revision 49 → 53, with no API errors.

- [Independent clarification assessment](evidence/gtd-workflow-20261004/clarification-assessment.json)
- [Clarification decisions and assertions](evidence/gtd-workflow-20261004/clarification.json)

## Evidence and applicability

- [Reusable caller playbook](evidence/gtd-workflow-20261004/reusable-playbook.md)
- [Scenario decisions and assertions](evidence/gtd-workflow-20261004/workflow-outcomes.json)
- [Evaluated source fingerprints](evidence/gtd-workflow-20261004/source-fingerprints.json)
- [HTTP call ledger](evidence/gtd-workflow-20261004/http-call-ledger.json)
- [Independent initial assessment](evidence/gtd-workflow-20261004/initial-assessment.json)
- [Blind fresh-context review](evidence/gtd-workflow-20261004/blind-reuse.json)

This is behavioral acceptance of the requested caller workflow on the existing MCP → Worker → local D1 path. Category meaning and review procedure are caller policy, not an Ariadne-owned GTD engine. Long-term reduction in management effort is not established by this finite scenario. The initial assessment's additional unknown-outcome and conflict-recovery suggestions were outside this workflow scenario, not failures of its observed stages.
