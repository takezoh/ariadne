# Reusable caller GTD playbook

Run on an explicit user capture, organize or review request. GTD is caller policy; no server GTD engine, scheduler or external monitor is configured. This run used built HTTP Worker localhost:8787/mcp and Wrangler local D1, disposable owner gtd-workflow-20261004, not hosted D1 or ChatGPT acceptance.

## Reusable caller prompt

“Read live saved state. Capture each new input separately with an ordinary title and exact original notes. Preserve ambiguity without invented commitments or dates. Ask only questions whose answer changes the next step. Organize only committed outcomes and source-supported steps. Use caller tags Someday/Maybe, Reference, Undecided, Actionable and Next action. Explicit waiting can be on-hold. Review every unfinished active/on-hold action including deferred/nonactionable records; separately show waiting, someday and reference. Show committed projects and their next action or why none is supported. Offer focus suggestions without writes. Apply reported progress only when authorized; child completion never completes the parent.”

## Procedure and policy

1. initialize then tools/list; read list_actions before reasoning and each write. Use current revision and saved IDs.
2. capture_intent preserves original notes. structure_create reuses the captured root and adds only original-source steps. Assign catalog project explicitly to roots and children; membership is not inherited.
3. Set explicit deadlines only. Preferences remain notes. Date-only Defer needs date/timezone preview, then commit the returned UTC until.
4. Actionable tags mark executable leaf steps, not project outcomes or unspecified replies. Next action is caller selection, never a prerequisite or execution gate. Ordered later steps remain executable.
5. Repeat review using saved perspectives below; reread and compare revisions. Suggestions alone never save changes. Include all unfinished records before recommendations.
6. Apply reported changes only within authorization. Receiving a reply does not complete the waiting action or establish the next step without its content. Completing a child does not complete its parent. Reconsider next-action selection from current state and the reported facts.
7. For a temporary less structured query, query_actions with status active, is_deferred false and Actionable tag. If a genuinely executable on-hold item exists, query on-hold too and union stable IDs. Do not save another perspective. Exclude reference/someday/undecided by positive caller classification; inspect current tags before trusting results.
8. Retain exact tool/operationId/arguments before write. Unknown response: operation_status or identical replay, never new ID. Explicit revision conflict: reread and reconcile without erasing corrections. Read back before claiming saved.

## Saved perspective definitions

```json
[
  {
    "id": "04b6dd43-579c-46f0-8b01-9e2bee2bc184",
    "name": "Someday/Maybe",
    "description": "Reusable caller review extraction; advice never changes saved state.",
    "filter": {
      "statuses": [
        "active",
        "on-hold"
      ],
      "tag_id": "a04e65c1-dc70-4d80-af5a-d71f4d7ea492"
    },
    "definition_version": 1,
    "revision": 42,
    "created_at": "2026-10-03T15:12:03.347Z",
    "updated_at": "2026-10-03T15:12:03.347Z"
  },
  {
    "id": "18a712a1-90fc-405e-a765-e100baf581f1",
    "name": "Reference",
    "description": "Reusable caller review extraction; advice never changes saved state.",
    "filter": {
      "tag_id": "214c2a30-338b-4a54-80af-5deb6382eeb0"
    },
    "definition_version": 1,
    "revision": 43,
    "created_at": "2026-10-03T15:12:03.521Z",
    "updated_at": "2026-10-03T15:12:03.521Z"
  },
  {
    "id": "3e490cec-40c5-40d0-94c6-c3b5d6f73a49",
    "name": "Waiting for",
    "description": "Reusable caller review extraction; advice never changes saved state.",
    "filter": {
      "statuses": [
        "on-hold"
      ]
    },
    "definition_version": 1,
    "revision": 41,
    "created_at": "2026-10-03T15:12:03.173Z",
    "updated_at": "2026-10-03T15:12:03.173Z"
  },
  {
    "id": "538da542-3998-444b-bab3-07bf29898bd7",
    "name": "Complete unfinished inventory",
    "description": "Reusable caller review extraction; advice never changes saved state.",
    "filter": {
      "statuses": [
        "active",
        "on-hold"
      ]
    },
    "definition_version": 1,
    "revision": 40,
    "created_at": "2026-10-03T15:12:03.000Z",
    "updated_at": "2026-10-03T15:12:03.000Z"
  },
  {
    "id": "9e78c6b8-6b98-4c47-b6a5-d94c8878c1a5",
    "name": "Next actions",
    "description": "Reusable caller review extraction; advice never changes saved state.",
    "filter": {
      "is_deferred": false,
      "statuses": [
        "active"
      ],
      "tag_id": "c8a96d6d-f237-47b5-b358-9d5878f4d369"
    },
    "definition_version": 1,
    "revision": 44,
    "created_at": "2026-10-03T15:12:03.708Z",
    "updated_at": "2026-10-03T15:12:03.708Z"
  }
]
```

## Caller IDs

```json
{
  "tags": {
    "Someday/Maybe": "a04e65c1-dc70-4d80-af5a-d71f4d7ea492",
    "Reference": "214c2a30-338b-4a54-80af-5deb6382eeb0",
    "Undecided": "bb319455-970d-4825-89aa-5a8f1f108467",
    "Actionable": "f8619690-2c07-4d5f-888c-a39dcc59b5df",
    "Next action": "c8a96d6d-f237-47b5-b358-9d5878f4d369"
  },
  "projects": {
    "tax": "b8b27ae2-8cc3-4c7f-b91a-ac14aba3a93d",
    "kyoto": "c6095303-5782-439b-94c2-5bc0a855df46"
  }
}
```

