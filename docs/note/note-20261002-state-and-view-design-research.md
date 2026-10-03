---
id: note-20261002-state-and-view-design-research
kind: note
title: Research on State, Views and Parameter Design
status: published
created: '2026-10-02'
updated: '2026-10-02'
summary: Uses the reference product's official version 4.9.2 manual to distinguish the meaning of states, dates, and saved views from workflows that should not be transferred to Ariadne.
topic: state-and-view-design
tags: [research, state-and-view-design, perspectives, gtd]
owners: []
relations:
  - {type: references, target: design-product}
  - {type: references, target: design-state-and-perspectives}
  - {type: references, target: note-20261002-gtd-benefits-and-llm-research}
source_paths: []
---
Product and vendor names and identifying source URLs have been removed from this historical reference. The observations below are retained research summaries, not independently verifiable source citations.


# Research on State, Views and Parameter Design

## 1. Purpose and Referenced Version

Checked on 2026-10-02. This research note addresses the user's direction to use the reference product as a reference for designing perspectives and parameters.

The referenced version is fixed at the **official manual for reference product version 4.9.2**. This does not claim that it was the latest version at the time of review. This review covers the design meaning in the manual, not a comprehensive comparison of feature availability, pricing, platform differences, or detailed behavior on a live device. The app itself was not tested.

| ID | Primary source | Main topics reviewed |
| --- | --- | --- |
| O1 | Custom Perspectives (source URL removed) | Criteria, display, grouping, sorting |
| O2 | The Inspector (source URL removed) | Dates, estimated duration, tags, review, recurrence, and other attributes |
| O3 | Perspectives (source URL removed) | Project structure, availability, and list behavior |

The sections below separate observations from proposals for Ariadne. The [State and Perspectives design](../design/state-and-perspectives.md) is the authority for product decisions; this note is not a direct implementation request for additional features.

## 2. Perspectives: Definitions of Views, Not Data Copies

**Observation (O1):** Custom perspectives define saved views over existing items. Nested All/Any/None criteria can filter by state, date, tags, and other fields, with grouping and sorting options.

**Proposal for Ariadne:** Keep one source of truth for tasks and treat selection, display order, and dot recommendations separately. Do not create separate task stores for “Today,” “Home,” or “Short.” A meaningful temporary question can be used as an ad hoc condition; it need not create another saved view each time.

Make saved criteria reproducible; do not make free-form LLM selection appear equivalent to a complete criteria search. Distinguish an item not being recommended from it failing the criteria. This is an Ariadne design concern when an LLM is involved, not a description of functionality of the reference product.

## 3. Separate the Meaning of Dates and Availability

**Observation (O2):** Defer, Planned, and Due are separate dates. They distinguish when an item becomes actionable, when work is planned, and when it is due. The reference product also supports estimates, tags, flags, review intervals, and recurrence settings. Tags can have multiple assignments and may use mutually exclusive groups.

**Proposal for Ariadne:** Do not collapse “I want to forget this until Friday,” “I want to work on it Friday,” and “I need it by Friday” into the same date. Saving a planned date as a deadline would change the user's commitment.

At the same time, the number of attributes is not value by itself. Tags, duration, and energy are candidates for situations where they help, not required input. Allow unknown values, and do not confuse inferred values with the user's confirmed intent.

Design review and recurrence separately from the existing MVP. Relevant distinctions for Ariadne include user review versus AI inspection, fixed intervals versus intervals after completion, and past completion history versus the next occurrence.

## 4. Project Structure and Availability

**Observation (O3):** The reference product offers Sequential, Parallel, and Single Actions List structures. Available and First Available are different concepts. In Parallel projects, the first item in order may be treated as First Available; in Single Actions Lists, several actions can be First Available. First Available should not be interpreted as “most important.”

**Proposal for Ariadne:** Separate parent-child relationships, which express containment, from dependencies, which express prerequisites for execution. Do not create sequential dependencies from the order in which an LLM listed actions, and do not treat the first item as the most important.

Even if Ariadne adds an “Available now” view, it should be an additional filter, not a replacement for the normal list. Ariadne has already adopted the contract that dependency-waiting tasks remain in the normal list with a reason when not deferred.

## 5. Boundaries for What Should Not Be Transferred Directly

| Topic | Treatment in Ariadne |
| --- | --- |
| Detailed attribute settings | A means for dot to express decisions, not a way to add user maintenance work |
| Availability-based filtering | Do not replace the normal list; add a view only if useful |
| Order and importance | Separate structural order and dependency-based availability from recommendation priority |
| Project types | No dedicated field exists in the current schema; decide additions based on semantic need |
| Dates, time, and tags | Do not send unsupported attributes to existing APIs or disguise Planned as Due |
| Review and recurrence | Use as references, but do not add them to the MVP through this documentation change |
| Parent completion behavior | Keep Ariadne's adopted C2 instead of copying the reference product's parent-completion behavior |

In particular, the reference product describes project completion in a way that includes completion of child items (O3), while Ariadne has already adopted the contract to **reject completion of a parent with incomplete descendants**. This difference is a product decision, not a defect; it prevents work that has not been done from being marked complete unintentionally. Prefer [requirements C1–C4](../changes/change-20261001-structured-todo-mvp/requirements.md).

## 6. Connection to GTD

GTD is a reference for what to get out of one's head and what to review. The reference product is a reference for structures that preserve and display those meanings. Neither requires that users perform the same management work.

Broadly, GTD's Defer is more than hiding items until a date. Losing this distinction can hide actions that are available but simply not intended right now. See G4 in the [GTD research note](note-20261002-gtd-benefits-and-llm-research.md).

## 7. Conclusion

The useful reference is **separating the meaning of states and showing the same state according to the current purpose**. Ariadne provides this through a thin operation layer used by dot. Which parameters to store and which perspectives to save should be chosen based on assistance scenarios and benefits.

The official manual supports the meaning of features of the reference product, but it is not a comparative study showing reduced cognitive load. Whether natural-language view generation or dot recommendations work better than manual use must be evaluated separately in the [assistance design](../design/assistance.md).
