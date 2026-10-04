---
id: note-20261004-outcome-first-messaging
kind: note
title: Outcome-first messaging and workflow design with an AI
status: published
created: '2026-10-04'
tags: []
owners: []
relations:
- {type: references, target: design-product}
source_paths:
- README.md
- PRODUCT.md
summary: User-adopted outcome-first headline, pillars and repository description centered
  on designing a workflow with an AI.
updated: '2026-10-04'
---

# Outcome-first messaging and workflow design with an AI

## Decision and source

Source: the user's direction in this repository conversation on 2026-10-04, while drafting the GitHub repository description.

The user asked for benefit-, outcome- and appeal-first wording built around designing a workflow together with an AI, with GTD as a reference point. They stated that appeal matters more than literal precision, and that Ariadne is always used with an AI: the data-layer API alone has no value to the user. The user then adopted rewriting README from the selected repository description's perspective.

The first selected description said "Design a GTD-like workflow". The user observed that this reads as if a GTD workflow were built in, whereas any workflow can be designed and GTD is only an example. The adopted wording therefore makes the user's own workflow the subject and lists GTD among several examples:

> Keep less in your head. Design your own workflow with your AI—GTD, a simple daily list or something entirely new. It captures, organizes and reviews your tasks your way, while you stay in control.

Adopted direction:

- Headline: "Keep less in your head. Your AI keeps track of the rest." Supporting line: "Design your own workflow with your AI—GTD, a simple daily list or something entirely new. It captures, organizes and reviews your tasks your way, while you stay in control."
- GTD appears as one example among several workflows, never as a built-in or default method. README states that no method is built in and includes a non-GTD example prompt.
- Pillars, in order: Get it out of your head; Design a workflow that fits you; Let your AI do the upkeep; Stay in control—without watching every change. The previous "See and fix anything" pillar is part of staying in control.
- User-facing text uses "tasks" and has the user and their AI as subjects. Data-layer responsibilities and limits move to a "How it works" section. "Action" appears as the saved form of a task, matching the dedicated UI label, and in the GTD term "next action".

This supersedes the headline and pillar names in the [2026-10-03 positioning record](note-20261003-product-positioning-audience-and-claim-b.md). Audience, differentiators and claim boundaries from that record remain. The governing statement is in the [product design](../design/product.md).

## Scope and preservation

Updated: README, PRODUCT, the product design and the GitHub repository description.

Not changed: product name, audience, claim boundaries, runtime, API, schema, UI labels, Skill, assistance text, installation guide and deployment. Existing notes and recorded research keep their contents.

## Validation

- Document graph `lint` and `lint --conformance`: passed, 67 indexed documents, no warnings.
- Local Markdown references in the four changed or new documents: no missing targets.
- Stale wording: the previous headline and pillar names no longer appear in README, PRODUCT, the product design, the development guide or usage documents.
- Claim review: new user-facing statements stay within the product design's claim boundaries; reminders, calendar planning, background execution and Ariadne-owned AI remain excluded.

This is documentation validation. App tests, build and actual-host acceptance were not run, and no deployed behavior is claimed.
