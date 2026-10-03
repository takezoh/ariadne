# Ariadne — Product

**Hand your to-do list to your AI—without watching over it.** Your AI organizes it your way; you can see and fix anything, anytime. Ariadne is a task list built for an AI to manage, so you can spend less effort remembering, collecting, organizing and reviewing tasks and more attention on action, decisions and rest. It currently provides its data tools and shared UI as a ChatGPT plugin; the concept is AI-delegated task management, independent of a particular assistant or management method.

## Who it is for

| Audience | Why Ariadne fits |
| --- | --- |
| Individuals who use an AI assistant daily and want it to handle task upkeep, especially people for whom maintaining a to-do app became work in itself | No app routine has to be learned; the method lives in conversation, and safe writes reduce the need to supervise each change |
| GTD practitioners and people who run their own systems | The method stays in prompts while actions, containment, projects, tags, dates and perspectives remain stable |
| People who build their own agents or scheduled workflows | Composable API/MCP tools accept changes from any authorized caller workflow |

Ariadne is a personal task list. Team project management, automatic calendar planning and reminders are outside its scope.

## Value and approach

| Desired benefit | Supporting behavior |
| --- | --- |
| Keep less in your head | Save the original input, including unresolved concerns and references, without requiring a deadline, classification or commitment |
| Set aside what is unnecessary now | Defer hides actions until a chosen time while preserving content and Due |
| Delegate without watching every change | Writes based on an outdated revision are rejected instead of overwriting newer edits; the UI retains unsaved proposals; identical retries are recognized and not applied twice; lost responses can be checked or resent exactly; Undo refuses to erase later corrections |
| Manage your way | Prompts and AI workflows choose GTD or another method over the same data tools |
| Change methods without rebuilding lists | Keep saved actions while changing prompts and caller-side routines |
| See and fix anything | Conversation and UI read and update the same saved actions |
| See relevant work | ChatGPT presents candidates with reasons, distinct from the complete list |

Your AI handles meaning, organization, recommendations and management policy. Ariadne provides structured task data through API/MCP operations and a dedicated UI, with durable state, validation, revisions, atomicity, replay, Undo and ownership. The API entity is named action. Containment, projects, tags, order, direct flags, dates and perspectives support GTD or another caller-chosen management method without requiring a fixed workflow.

User prompts, dot and caller-side schedulers can use the same tools. An authorized agent can collect Slack/email commitments with its own external tools and save or update actions in Ariadne. No dedicated Ariadne agent integration is needed: source access, interpretation, execution timing and notifications are responsibilities of the caller. Changing the caller's workflow does not require changing Ariadne's data operations.

## What Ariadne does not promise

- Ariadne does not remind, notify, plan a calendar or run in the background.
- Ariadne has no AI of its own and does not decide what matters.
- Ariadne saves what the caller requests. It cannot prove that your AI interpreted you correctly; inspect and correct actions as needed.
- Undo works only within retained recent history, the latest 100 operations per owner, and refuses when it would erase later corrections. Not every change can be undone.
- Confirmation steps shown by the host are outside Ariadne.
- Ariadne currently works through ChatGPT; other assistants have not been verified.
- Reduced management effort is an intended benefit, not a measured result.

## Everyday usage

Capture an input such as “Prepare for the trip: check what I have, then buy what is missing; keep the information page as a reference.” Preserve the original wording and organize only intended actions. Place the actions under a parent and order checking before buying. That order expresses the user's plan without preventing a later action from being completed first. Reference URLs do not automatically create additional work.

A concern such as “I may clear out the family house, but have not decided how much” can remain in Inbox with its original notes. Saving does not require a deadline, classification or commitment to perform it.

Defer an action when it is unnecessary now. A date-only choice resolves to that day's 09:00 in the explicit client timezone; later timezone changes do not shift the saved instant. Parent Defer affects descendants' visibility without overwriting their dates. Deadline conflicts can be shown before saving.

Arrange sibling actions by order and use direct Flags to mark attention. A Flag does not inherit and does not change lifecycle, Due or Defer. The Flag view includes marked normal-view actions; deferred or ended flags remain saved and queryable.

Save a reusable perspective through conversation when you want to repeat a particular selection. Perspectives store extraction conditions only and retain the existing action order; dedicated perspective UI controls are not provided. Ask for candidates matching a purpose or context. Recommendation alone does not hide, complete, defer or drop unselected actions. Return to the full normal, deferred or historical list when needed.

## State and relationships

| Concept | Meaning |
| --- | --- |
| Action | A saved editable item, including original input and reference notes |
| Containment | One parent action; independent prerequisite edges are absent |
| Order | Intended sibling sequence, without execution or display restrictions |
| Direct Flag | Optional boolean attention mark, without inheritance |
| Project / tags | Separate classification hierarchies; an action has at most one project and multiple tags |
| Inbox | Unfinished project-unassigned actions, including deferred ones |
| Normal | Unfinished actions not hidden by own or ancestor Defer; includes explicit on-hold |
| On-hold | Explicit waiting, independently editable and distinct from Defer |
| Due | A deadline, distinct from wanting to work on a date |
| Completed | Finished work; completing a parent completes descendants atomically |
| Dropped | Withdrawn work, retained and editable rather than falsely completed |

Completing all children never automatically completes the parent. A descendant can reopen independently of a completed ancestor. When the user or an authorized caller reports evidence of an arrival, it can update the explicit waiting state without automatically completing the action or releasing Defer. Ariadne stores the requested change; observation and interpretation belong to the caller.

## Conversation, UI and reliability

Conversation accepts uncertainty, helps organize relationships and explains candidate choices. The dedicated ChatGPT UI provides the saved list, notes, dates, order and Flag controls for direct correction. Both use one durable state.

After a conflict compare the latest saved state with the retained proposal. After a missing response preserve the original request and check its result or resend identically. Do not claim success or failure merely from response loss. Undo does not silently erase later target edits. These guarantees reduce the supervision burden of delegating organization.

## Scope and evidence

Current scope includes original-input preservation, actions, containment, order, direct flags, projects/tags, explicit on-hold, Due/Defer, lifecycle editing, replay and Undo, shared by conversation and UI. Independent prerequisite edges and sequential/parallel modes are unsupported. Planned, estimates and recurrence are not implemented data capabilities. Calendar synchronization, notifications, external-source collection and background execution are caller capabilities; callers may compose such workflows with Ariadne data tools, and they are not prerequisites or planned integrations for using the plugin.

Local tests and implementation completion do not establish hosted acceptance or long-term reductions in management effort. Hosted behavior requires verification in the actual delivery environment.

Success means fewer missed important matters and less total remembering, explanation, approval, correction and supervision work. More actions or completions alone are not success; dropping work or resting can be appropriate choices. General availability and pricing remain undecided.

[Introduction](README.md) · [Architecture](ARCHITECTURE.md) · [Development](docs/development.md)
