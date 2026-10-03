---
id: note-20261002-gtd-benefits-and-llm-research
kind: note
title: Research on GTD Benefits and Redesigning Assistance with LLMs
status: published
created: '2026-10-02'
updated: '2026-10-02'
summary: Separates original GTD sources, cognitive research, LLM planning research, and public practice examples; records implications for Ariadne and the benefits that remain unproven.
topic: gtd-benefits-and-llm
tags: [research, gtd, cognition, llm]
owners: []
relations:
  - {type: references, target: design-product}
  - {type: references, target: design-assistance}
  - {type: references, target: note-20261002-state-and-view-design-research}
source_paths: []
---
Product and vendor names and identifying source URLs have been removed from this historical reference. The observations below are retained research summaries, not independently verifiable source citations.


# Research on GTD Benefits and Redesigning Assistance with LLMs

## 1. Questions and Research Scope

Reviewed on 2026-10-02. Rechecked original sources, papers, and public practice examples mentioned in the conversation so far, and organized them for use in Ariadne product design. This is a focused research note, not a comprehensive systematic review or a test of public implementations.

The question is not only “How can an LLM perform GTD?” The focus is **what benefits GTD provided, and how its procedures or rules could change if management work previously done by people is shifted to an LLM**.

Technical/research claims use primary sources, authors' papers, and publisher/institution records. Public personal practices are treated as a separate evidence category. Referenced versions and review scope are described below; extensive source text and paper files are not redistributed.

## 2. Summary and How to Read the Evidence

There is a rationale for exploring a design that reduces management burden while preserving trusted externalization, clear handling, and appropriate reconsideration rather than automating GTD unchanged. However, the research reviewed here does not establish that “leaving things to a prompt reduces long-term burden compared with conventional GTD without increasing omissions.”

| Evidence type | Sources | What it supports | What it does not support |
| --- | --- | --- | --- |
| Method's original sources | G1–G4 | GTD's goals and mechanisms | Causal proof of effectiveness |
| Cognitive experiments | R1, R3 | Effects of planning and externalization costs on specific tasks | Same effects for AI-generated plans or all of Ariadne |
| Theory/design principles | R2, R4 | Frameworks for external memory and division of work between people and systems | Effects of current LLM implementations |
| Research proposal | R5 | Concept for long-term assistance that includes GTD | Results from evaluations that were not performed |
| Limited LLM-assistance research | R6–R9 | What helps or burdens users in conversation, planning, and intervention | Long-term superiority in everyday life |
| Public practice/implementation descriptions | N1, N2 | Concrete configuration and operational references | Independent verification of effectiveness or safety |

## 3. Original GTD Sources

### G1. Official GTD: What Is GTD?

Source: [Official Getting Things Done site](https://gettingthingsdone.com/what-is-gtd/). Scope: official overview.

Five activities—capture, clarify, organize, reflect, and engage—manage intentions and commitments in a trusted external system. This includes deciding what to do with information that will not become an action. Read GTD as a method aimed at clearing the mind and making choices, not merely creating lists.

**Interpretation for Ariadne:** Use the five stages to check for missing functions, not as a mandatory conversation sequence. This is an Ariadne design interpretation, not a direct quotation from the original source.

### G2. David Allen: The Two-Minute Rule (2020)

Source: [Official GTD site, 2020-05-29](https://gettingthingsdone.com/2020/05/the-two-minute-rule-2/). Scope: transcript of the author's explanation.

The rule is explained as an efficiency principle: a short action can cost less to do now than to read, think about, and handle again later.

**Hypothesis for Ariadne:** If an LLM changes the cost of saving, resurfacing, or preparing, the result of the same principle may change. Include context switching and approval; it is not established that “two minutes” should simply be replaced by another fixed threshold.

### G3. GTD Weekly Review Checklist

Source: [Official one-page PDF](https://gettingthingsdone.com/wp-content/uploads/2014/10/Weekly_Review_Checklist.pdf). Scope: full checklist and rendered page.

The review covers more than action lists: things on one's mind, past/upcoming calendar, waiting items, projects, and future possibilities. It combines maintenance tasks with the function of reconsidering interests and commitments.

**Hypothesis for Ariadne:** Even if dot handles mechanical checks, it should not eliminate the user's opportunity to reconsider direction. Distinguish AI-checked from user-reviewed.

### G4. GTD Workflow Map

Source: [Official one-page PDF](https://gettingthingsdone.com/wp-content/uploads/2014/10/workflow_map.pdf). Scope: inspected the full diagram on screen.

Defer in the diagram has a broad meaning that includes placing actions not to be done now on a calendar or Next Actions list. It does not only mean hiding items until a particular date. Reference information, future possibilities, and waiting after delegation also have separate paths.

**Implication for Ariadne:** Do not collapse GTD's broad Defer, Ariadne's date-based Defer, Waiting For, and Someday/Maybe into a single state.

## 4. Cognitive Research and Design Principles for Benefits

### R1. Masicampo & Baumeister (2011): Planning and Interference from Unfulfilled Goals

Citation: E. J. Masicampo, Roy F. Baumeister. *Consider It Done! Plan Making Can Eliminate the Cognitive Effects of Unfulfilled Goals*. Journal of Personality and Social Psychology. DOI: `10.1037/a0024192`.

Source: [Author-hosted PDF](https://users.wfu.edu/masicaej/MasicampoBaumeister2011JPSP.pdf). Scope reviewed: abstract, experiment descriptions, and conclusions; also inspected the rendered PDF.

Reports experimental results that making a specific plan reduces interference from unfulfilled goals. This supports considering whether handling is settled, not only whether the item was recorded.

**Limit:** The study concerns plans made by participants, not whether merely receiving an LLM-generated plan has the same effect. It is not an evaluation of all GTD activities in daily life.

**Design hypothesis:** Treat saving to D1 and the user's ability to set it aside with confidence as separate completion conditions.

### R2. Heylighen & Vidal (2008): Cognitive-Science Account of GTD

Citation: Francis Heylighen, Clément Vidal. *Getting Things Done: The Science behind Stress-Free Productivity*. Long Range Planning 41(6), 585–605. DOI: `10.1016/j.lrp.2008.09.004`.

Source: [VUB research portal](https://researchportal.vub.be/en/publications/getting-things-done-the-science-behind-stress-free-productivity/). Scope reviewed: bibliographic record and abstract from the institution; this does not claim a full rereading of the paper.

A theoretical discussion of GTD as a cognitive system involving external memory and interaction with the environment.

**Limit:** Not an intervention study that establishes the causal effectiveness of GTD.

**Design hypothesis:** Design the total system burden, including dot, saved state, and operation surface, rather than human memory alone.

### R3. Chiu & Gilbert (Online 2023 / Issue 2024): Externalization Also Has a Cost

Citation: Gavin Chiu, Sam J. Gilbert. *Influence of the physical effort of reminder-setting on strategic offloading of delayed intentions*. Quarterly Journal of Experimental Psychology 77(6), 1295–1311. DOI: `10.1177/17470218231199977`. Published online 2023-08-29; issue dated June 2024.

Source: [Publisher abstract and citation](https://journals.sagepub.com/doi/abs/10.1177/17470218231199977). Scope reviewed: abstract and bibliographic record.

Two preregistered experiments report that more physical effort to set a reminder reduced reminder-setting; lower-burden externalization helped offset the effect of memory load.

**Limit:** This concerns physical effort of operation, not the burden of approving or correcting AI.

**Design hypothesis:** Evaluate not only whether externalization exists, but also the effort required to keep using it. Do not infer an effect size for applying this to LLMs.

### R4. Horvitz (1999): Sharing Initiative Between People and Systems

Citation: Eric Horvitz. *Principles of Mixed-Initiative User Interfaces*. CHI 1999.

Source: [Author-hosted PDF](https://erichorvitz.com/chi99horvitz.pdf). Scope reviewed: design principles in the paper and rendered PDF.

Covers not only assistance benefits but also uncertainty about goals, incorrect assumptions, interruption costs, and the user's ability to stop or correct the system.

**Limit:** Not a long-term user study of LLMs or GTD.

**Design hypothesis:** Neither asking about every uncertainty nor automatically doing everything is the goal. Consider assistance value and the impact of mistakes; return necessary decisions to the person. Keep model guidance separate from guarantees enforced by code.

## 5. LLM Support for GTD, Planning, and Reflection

### R5. Wang (2024): GOLF

Citation: Ben Wang. *GOLF: Goal-Oriented Long-term liFe tasks supported by human-AI collaboration*. Referenced version: arXiv `2403.17089v2`.

Source: [Author's paper](https://arxiv.org/html/2403.17089v2). Scope reviewed: GTD-based structure and evaluation plan.

Proposes using GTD and other methods to decompose long-term goals into activities and tasks, with human-AI collaboration for information gathering, decision making, and real-world action. Initial high-level plans and progressive detail are relevant references.

**Limit:** The evaluation is described as a plan; this is not evidence that the proposed assistance benefits have been measured. A multi-agent configuration is not a requirement for Ariadne.

**Design hypothesis:** Do not decompose every step up front; support the detail currently needed and updates as work progresses.

### R6. Abbas et al. (CHI 2026): PITCH

Citation: Adnan Abbas et al. *“Having Lunch Now”: Understanding How Users Engage with a Proactive Agent for Daily Planning and Self-Reflection*. Referenced version: arXiv `2509.24073v4`. DOI: `10.1145/3772318.3790957`.

Source: [Authors' paper](https://arxiv.org/html/2509.24073v4). Scope reviewed: user study, results, and design discussion.

A 14-day study with 12 people captures adjustment, resistance, and disengagement in addition to acceptance of suggestions. It identifies issues such as rigid conversation, responses arriving too early, and assistance promises the system cannot fulfill.

**Limit:** A limited sample and duration; not proof of long-term superiority over GTD in daily life.

**Design hypothesis:** Evaluate concise, necessary questions and interaction that supports ignoring, postponing, or correcting suggestions instead of requiring a fixed questionnaire every time. Check execution capability before offering assistance.

### R7. Feng et al.: Cocoa

Citation: K. J. Kevin Feng et al. *Cocoa: Co-Planning and Co-Execution with AI Agents*. Referenced version: arXiv `2412.10999v4` (initial version 2024).

Source: [Authors' paper](https://arxiv.org/html/2412.10999v4). Scope reviewed: experiments, field study, and design discussion.

Studies collaborative planning and execution between people and AI through editable plans. Includes a study with 16 people and a one-week field study with 7 people. Its structure for directly changing a plan and guiding execution is a useful reference.

**Limit:** The primary setting is research activity, not all personal daily GTD. No significant usability difference does not prove equivalence. The danger of approval becoming perfunctory is treated as the authors' design discussion, not an established quantitative law.

**Design hypothesis:** Provide a UI to directly correct the same state as well as conversation. Do not assume that adding controls or approval buttons alone reduces burden.

### R8. Wang & Liu (2025): ChatGPT for Long-Term Life Planning

Citation: Ben Wang, Jiqun Liu. *Your plan may succeed, but what about failure? Investigating how people use ChatGPT for long-term life task planning*. Referenced version: arXiv `2512.11096v1`.

Source: [Authors' paper](https://arxiv.org/html/2512.11096v1). Scope reviewed: method, interview results, and limitations.

A study with 14 people covers usefulness for goal decomposition and reflection, as well as plans that are too generic or idealized and difficulties adapting to personal circumstances and change.

**Limit:** Does not follow long-term goals until actual completion. Do not infer objective plan-success rates from a study of reported user experience.

**Design hypothesis:** Preserve assumptions, unresolved items, and original intent along with the plan, and allow reconsidering whether to continue when circumstances change.

### R9. Pu et al. (2025): ProMemAssist

Citation: Kevin Pu et al. *ProMemAssist: Exploring Timely Proactive Assistance Through Working Memory Modeling in Multi-Modal Wearable Devices*. Referenced version: arXiv `2507.21378v1`.

Source: [Authors' paper](https://arxiv.org/html/2507.21378v1). Scope reviewed: experiment with 12 people, results, and limitations.

Uses wearable input and a model of working memory to choose intervention timing. Reports more selective interventions and a higher positive response rate than an LLM baseline. However, the absolute counts of positive responses were 32 versus 31, there was no significant difference in task completion time, and workload measures did not all improve.

**Limit:** A limited physical-task experiment, not evidence for everyday ToDos or long-term life assistance. Do not reinterpret response rate improvement as benefit across daily life.

**Design hypothesis:** Separate “return to the candidate list” from “interrupt and show now.” This does not prove prompts alone can choose timing well; consider necessary context, state, and evaluation. It also does not justify adding sensors or a dedicated working-memory engine to Ariadne.

## 6. Public Practices and Implementation Descriptions

### N1. mikonos/LLM-GTD

Source: [Public repository](https://github.com/mikonos/LLM-GTD). Scope reviewed: public README and related descriptions as of 2026-10-02. This is a changeable README, not an execution evaluation pinned to an implementation commit.

Describes common Markdown state and GTD Skills used from coding assistants. Separates mechanical capture/clarify/organize activities from human involvement in execution/review.

**Useful reference:** Separate workflow guidance, persistent state, and connection to an execution environment.

**Not adopted by implication:** Markdown as Ariadne's source of truth, CLI-oriented UX, fixed list structure, or the quality/reliability of public code and operations. The code was not run or audited here.

### N2. Practice Report in a reference-product user forum

Source: “GTD is the ontology, the reference product is the system of record, and ChatGPT is the coach” (source URL removed). Author: TheTallDesigner. Referenced thread from August 2026. Scope reviewed: author's description of their personal workflow.

An example that separates GTD semantics, the reference product as the source of truth, and ChatGPT as coach, while checking existing state during organizing and review. Its insistence on clearly reporting write success and verification is useful.

**Limit:** Personal self-report, not an official reference-product vendor recommendation or independent effectiveness evaluation.

**Difference from Ariadne:** Ariadne does not require GTD's fixed classification system and reconsiders the workflow itself based on benefits. Use the role separation as a reference, not a workflow to copy as-is.

## 7. What to Carry from Research into Design

The following are design inferences for Ariadne, not direct conclusions of the cited sources.

| Design question | Main references | Proposed direction |
| --- | --- | --- |
| Why is storage alone insufficient? | G1, R1 | Also check that the user understands how the item will be handled and can feel confident |
| How should management burden be reduced? | R2, R3 | Include supervision of AI in the total burden, not just input/classification effort |
| How much to ask or automate? | R4, R6, R7 | Return only necessary decisions based on uncertainty and impact |
| How much to change the workflow? | G2–G4, R5 | Preserve the functions of fixed stages rather than requiring the stages |
| How to update plans? | R5, R7, R8 | Preserve original intent and assumptions; add detail progressively and reconsider it |
| When should items be shown? | R6, R9 | Separate selection from intervention timing and evaluate within actual host capabilities |
| How to separate storage and judgment? | N1, N2 | Separate dot's prompt from D1 as the source of truth |

The final division of responsibilities is not uniquely derived from the literature. **Ariadne as a thin interface to D1, with dot providing assistance through prompts, is the product architecture specified by the user.** The literature provides questions for evaluating that design.

## 8. Corrections to the Initial Research and Open Questions

The initial synthesis leaned toward “how to delegate GTD to an LLM.” Reconsidering from benefits removes the assumption that fixed five stages, classifying every item, simply automating weekly review, or building a recommendation engine into Ariadne itself are requirements.

The evidence was also qualified: GOLF's proposal is not treated as evaluated; limited settings in PITCH and Cocoa are retained; ProMemAssist response rates are distinguished from benefits; personal practice is separated from experiments.

This research does not resolve whether a user can feel at ease with only AI-organized state, whether exception-focused checks avoid omissions, whether repeated corrections preserve user intent, whether supervision burden stays below the original management burden, or whether the host provides the necessary opportunities to act.

The conclusion is therefore: **there is a rationale and a set of evaluation questions for redesigning from benefits, but Ariadne must test whether the redesign works.** This connects to the [assistance design evaluation proposal](../design/assistance.md) and should not be confused with acceptance of the existing Work deployment.
