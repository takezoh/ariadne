---
id: note-20261004-dot-detected-action-routing
kind: note
title: dot detected-action routing acceptance
status: published
created: '2026-10-04'
tags: []
owners: []
relations: []
source_paths: []
summary: Emulated personal and work Slack/email detections routed through public MCP
  to local D1 with a notification tag and confirmation queue.
subject_paths:
- app/mcp/route.ts
record_type: debug-experiment
updated: '2026-10-04'
---

## Summary

The emulated detected-event workflow passes. An LLM caller acting on dot's detected inputs selected public MCP tools from live discovery, saved four confirmation items into Personal/Work projects with a Notification tag, and queried the confirmation queue. It preserved source text, URLs and event IDs. Repeated detection produced no duplicate or state change. Confirmation of one message cleared only its Notification tag, leaving the action active.

## Scenario and acceptance

The user requested verification after detection, explicitly excluding dot's live Slack/email monitoring. The four synthetic events covered personal Slack (lunch confirmation), personal email (electricity-bill check), work Slack (release-proposal review), and work email (estimate confirmation). Source scope was supplied and trusted for project routing. Unknown scope must be clarified, not guessed.

| Check | Observed result |
| --- | --- |
| Initial routing | Personal 2; Work 2; Notification 4 |
| Source preservation | Exact message text, source URL and event ID retained in notes |
| Uncertain dates | No deadline inferred from Sunday lunch or an undecided release date; no Defer |
| Duplicate detection | Same work Slack event recognized from saved event ID, URL and text; revision 19 → 19; no new action |
| Confirmation | Personal email tag removed; same action remains active; other tags/classification unchanged |
| Final queue | Notification 3; Personal 1; Work 2 |
| Read-only reviews | Revision unchanged during both queue extractions |

There were 20 successful writes, revision 0 → 20, and no API errors. No reply, alert delivery, completion or external action was executed. Notification is a caller-defined saved tag, not a push-notification service.

Independent assessment passed. Live readback at revision 20 confirmed all four source records, project membership, final notification queue and the unchanged active status of the checked item. The assessor also checked discovery, HTTP requests and the actual local D1 binding.

## Environment and evidence

Execution used the existing built Worker at localhost:8788 and its env.DB Wrangler local D1 binding, with a disposable owner dot-detected-20261004. HTTP transport did not import the route or replace the binding. An initial localhost:8787 discovery performed public reads only; all scenario reads/writes ran against the selected 8788 Worker. Synthetic local identity headers supplied the test owner.

- [Independent assessment](evidence/dot-detected-20261004/independent-assessment.json)
- [Caller decisions, input events and assertions](evidence/dot-detected-20261004/caller-outcomes.json)
- [Exact requests and compact response ledger](evidence/dot-detected-20261004/http-call-ledger.json)
- [Evaluated source and built artifact fingerprints](evidence/dot-detected-20261004/source-fingerprints.json)
- [User-facing use case](../usage/use-cases.md#let-dot-collect-items-that-need-your-attention)

This establishes the requested handling of detected actions through MCP → Worker → local D1. Live dot monitoring, source authentication, detection quality, scheduler execution and alert delivery were not exercised.
