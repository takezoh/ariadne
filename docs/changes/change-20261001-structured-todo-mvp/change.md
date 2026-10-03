---
id: change-20261001-structured-todo-mvp
kind: change
title: Structured ToDo MVP with Defer
status: done
created: '2026-10-01'
profile: sdd@1
intent: Deliver a verifiable MVP for dot assistance that reduces cognitive and management
  burden, and for reliable structured ToDo and Defer behavior.
outcomes:
- Preserve user-approved experience contracts, observable primary flows, acceptance
  scenarios, and counterexamples.
- Define technical requirements, responsibility boundaries, ADRs, and dependency-ordered
  implementation/verification obligations with sources.
scope:
- docs/changes/change-20261001-structured-todo-mvp
- docs/adr/adr-20261001-cloud-run-firestore.md
- docs/adr/adr-20261001-defer-graph-consistency.md
- docs/development.md
- README.md
- docs/adr/adr-20261001-sites-d1-work-mvp.md
- .openai/hosting.json
- .gitignore
- .npmrc
- SITES-SOURCE.md
- package.json
- pnpm-lock.yaml
- pnpm-workspace.yaml
- tsconfig.json
- cloudflare-env.d.ts
- vite.config.ts
- next.config.ts
- postcss.config.mjs
- eslint.config.mjs
- drizzle.config.ts
- app/**
- lib/**
- db/**
- drizzle/**
- scripts/**
- skills/**
- build/**
- vendor/**
- public/**
- docs/note/note-20261001-structured-todo-implementation.md
non_goals:
- Calendar, time blocking, active notifications, external observation, independent
  inference, or changes to sharing scope.
change_classes:
- behavior
- boundary
- dependency
- invariant
governance:
  gate: auto
  reasons: []
members:
- role: requirements
  path: changes/change-20261001-structured-todo-mvp/requirements.md
  required: true
- role: implementation
  path: changes/change-20261001-structured-todo-mvp/implementation.md
  required: true
- role: verification
  path: changes/change-20261001-structured-todo-mvp/verification.md
  required: true
- role: ux
  path: changes/change-20261001-structured-todo-mvp/ux.md
  required: false
promotion:
- action: none
  reason: 'Declaration-only historical maintenance: existing linked ADRs and acceptance
    records remain authoritative; no new design promotion or current-runtime acceptance
    is asserted.'
evidence_refs:
- type: source
  ref: docs/note/note-20261002-work-benefit-acceptance.md
- type: source
  ref: docs/evidence/20261003-final-deployment.json
- type: command
  ref: node docs/note/evidence/verify-work-regression-20261003.mjs
unresolved_decisions: []
tags: []
owners: []
relations:
- {type: references, target: adr-20261001-cloud-run-firestore}
- {type: references, target: adr-20261001-defer-graph-consistency}
- {type: references, target: adr-20261001-sites-d1-work-mvp}
source_paths: []
summary: Implemented and deployed the in-scope MVP for PR01–PR07, S01–S22, and C1–C4,
  with personal-only access and Work acceptance. Fixed BUG-01/02, result lookup and
  identical retry, and post-fix assistance behavior.
closure:
  closed_at: '2026-10-02T17:24:31.486578+00:00'
  content_hash: sha256:de026a41e6bddbf7dbc3169932a650c6e9a23ae49820a8b82a5a219adbdd04b5
---

## Summary

Reflected the benefit-led product direction from 2026-10-02 in the requirements and MVP. Defines PR01–PR07 and seven flows with S01–S22. dot/prompt provides assistance; Ariadne ensures consistency of storage and operations through Sites + D1 + a dedicated UI. Maintains C1–C4 and does not add extension attributes in this change. In-scope implementation, deployment, and Work acceptance completed on 2026-10-03.

## Closure Notes

Use the 2026-10-03 update to the [Work acceptance record](../../note/note-20261002-work-benefit-acceptance.md) as the final verdict. In-scope work for the personal-use MVP with personal-only access is complete. Long-term benefit evaluation and general availability are not part of this change's completion verdict. Separate-account, infrastructure-only, CSP, and cost checks were excluded at the user's direction. The initial sidebar failure, the failure before assistance-policy fixes, and the passing result after fixes remain documented.

### English Translation Integrity Update

On 2026-10-03, the user requested English translations of all documentation, including historical evidence, and authorized resolving the resulting commit gate. The closure checksum was recalculated for the translated package. The original checksum was `sha256:24fd41e4bfb7c59a9826c70fe1004816f60de31e6849e915e1182c2aacf8fdad`. The original closure date and recorded acceptance verdict remain historical records; this translation does not constitute new acceptance.

### Authorized Ariadne Name Normalization

On 2026-10-04, the user explicitly requested replacement of all previous product names, including completed records and archived evidence. Names and references were normalized; the closure checksum was recalculated for this editorial update. The previous checksum was `sha256:59c27ff86575fa02e7d60bbfb22d28e863d4500fe4431097bcc0ac7c5c37d482`. This update is not new deployment or acceptance evidence. See [normalization provenance](../../evidence/20261004-name-normalization.json).
