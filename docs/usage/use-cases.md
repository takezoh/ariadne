# Use cases: ask your AI

Tell your AI what you want to hand over and how you want it handled. These examples are starting points for your own prompts. Your AI reads and changes the shared list in Ariadne; you can inspect and correct it in conversation or the dedicated UI.

## Put down an unfinished thought

> Keep this for me: I may clear out the family house, but haven't decided whether or how much. Preserve my words without adding a deadline or a commitment.

The concern stays saved while the decision remains open. You can return to it without having to classify it first.

## Turn notes into a project

> Organize my Kyoto trip preparation from these notes: book the hotel and pack. Keep the original notes. Ask if missing information changes the next step; don't add things I haven't decided to do.

Your AI can group the intended outcome and its concrete actions, keeping the source wording available. You can inspect the structure and change it as plans develop.

## Build a GTD routine together

> Help me build a GTD routine I can run by asking you. Capture each input first and preserve my exact words. Clarify only what changes the next step. Then organize committed projects, next actions, waiting-for, someday/maybe and reference. Create reusable views where helpful. Keep uncertain ideas separate from commitments.

Your AI can establish category conventions, project structure and saved perspectives with you. For example, a committed tax-return project can contain collecting receipts and filling the form; a possible chair purchase can stay Someday/Maybe. A reference link can remain reference material without becoming a commitment to read it.

Keep the routine as standing instructions or a reusable skill in your AI's environment. Ask for a review when you need it, and adjust the conventions as you learn what helps.

## Run a weekly review

> Run my weekly review using our routine. Check every unfinished item, including deferred items. Show waiting-for, someday/maybe and reference separately. For each committed project, show its next action or what information is missing. Suggest a small focus list without changing saved state.

The review combines a complete inventory with a useful selection. A suggestion stays a suggestion until you ask for a change. When a next step is unclear, your AI can surface the question instead of inventing work.

## Reflect progress and changed plans

> The landlord replied; I'm no longer waiting, but the issue isn't resolved. I collected the tax receipts. Defer packing until October 10, 2026 in Asia/Tokyo. Keep its deadline unchanged.

These updates have different meanings: a reply can release an explicit waiting state, collected receipts can complete that action without completing the whole tax project, and Defer can put packing aside until the requested date. Your AI can reconsider the next actions from the updated list.

## Simplify your method

> Make my routine less structured. Show unfinished, nondeferred actions I can do, excluding reference material and someday ideas. Keep my existing records and use a temporary selection for now.

You can change the prompts and selection rules while keeping the same saved actions. Save a perspective if you want to revisit the selection regularly.

## Inspect and correct the list

> Open my list so I can check and edit it.

> Undo the change you just made.

Conversation and the dedicated UI use the same saved list. Undo checks whether later corrections would be affected; your AI should explain any conflict before proceeding.

## Collect inputs from other tools

> Read the emails I selected and capture the commitments I made. Preserve their source wording and links, check my existing list for duplicates, and leave uncertain interpretations for review.

An AI with authorized email or Slack access can compose those tools with Ariadne. You can also arrange recurring collection or reviews through a scheduler available to your AI. Choose the sources, permitted changes, timing and delivery with that caller.

## Let dot collect items that need your attention

> Monitor my authorized personal and work Slack and email sources. When you detect something I need to check or respond to, save it in Ariadne under my Personal or Work project according to the source account or workspace. Preserve the original message, source link and event ID, and add my Notification tag. Check existing records before adding the same event again. If the scope is unclear, ask me. Don't invent a deadline, send a reply or mark anything complete.

For example, a lunch confirmation from personal Slack and an electricity-bill question from personal email go into Personal. A release-proposal review from work Slack and an estimate confirmation from work email go into Work. All four get the Notification tag, so you can ask:

> Show everything tagged Notification, grouped into Personal and Work. Keep the saved list unchanged.

After checking an item, you can say:

> I've checked the electricity-bill message. Remove its Notification tag, but keep the action open because the bill still needs handling.

The tag records what still needs your attention; clearing it is separate from completing the action. dot's source access and monitoring run in its environment. Notification is your saved tag; delivery of an alert is a separate caller action.

The detected-event portion of this workflow was [verified with emulated inputs](../note/note-20261004-dot-detected-action-routing.md): personal/work routing, original messages and links, tagged queries, duplicate-event handling and clearing one confirmation tag. Live Slack/email monitoring was outside that test.

For tool discovery, reusable skills and custom automation, see the [workflow guide](agent-workflows.md). For the meaning of actions, dates and perspectives, see [Product and usage](../../PRODUCT.md).
