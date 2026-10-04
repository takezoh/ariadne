# Ariadne

## Hand your to-do list to your AI—without watching over it.

**Your AI organizes it your way. See and fix anything, anytime.**

Ariadne is a task list built for your AI to manage. Ask your AI to capture, organize, review and update your tasks through your own prompts. You and your AI decide what matters and how to manage it; Ariadne keeps the saved list safe to change and easy to correct.

## Keep less in your head

Hand over commitments, concerns and unfinished thoughts as they are. Ariadne keeps your original wording without asking you to decide a deadline, classification or commitment first. Put aside what you do not need now with Defer; the action and its deadline stay saved.

## Delegate without watching every change

Ariadne is designed for an AI to write to it. A change based on an outdated list is rejected instead of overwriting newer edits, and the dedicated UI keeps your unsaved proposal. Retrying the same request does not create a duplicate. When a response is lost, the original request can be checked or resent exactly. Undo never silently erases corrections made afterward.

## Manage your way

Your method lives in your prompts. Use GTD, adapt it, or develop your own approach with your AI. Projects, tags, order, flags, dates, parent-child structure and saved perspectives are building blocks rather than a prescribed routine. Change the method at any time and keep the same saved list.

## See and fix anything

Conversation and the dedicated UI share the same saved list. Inspect it and correct it directly in either place. Ask your AI for the actions relevant to your current purpose, and return to the complete list whenever you want.

## Who it is for

Ariadne is for individuals who want their AI to handle the upkeep of their tasks—especially if keeping a to-do app going has felt like work in itself. It also suits people who practice GTD or their own system, and people who build their own agents or scheduled workflows.

Ariadne is a personal task list. It is not a team project management tool, and it does not plan your calendar or send reminders.

## Add Ariadne to ChatGPT

Ask ChatGPT Work to read [INSTALL.md](INSTALL.md) and perform the installation:

```text
Read https://github.com/takezoh/ariadne/blob/main/INSTALL.md and install Ariadne for me.
```

After connecting, ask Ariadne to read your saved actions and open the list.

Ariadne is currently provided as a ChatGPT plugin. It exposes your saved actions through API/MCP tools and a dedicated UI. Your prompts, ChatGPT's dot or a caller-side scheduler decide when and how to use the tools.

For example, an agent you configure with Slack or email access can collect commitments and save them through Ariadne's tools. Collection, interpretation, scheduling and notification belong to that agent's workflow; they do not require a dedicated Ariadne integration. Available execution and access depend on the agent's environment and your authorization.

Ariadne has no AI of its own. It handles persistence, input validation, deterministic state changes, ownership, revisions, replay and Undo. A deferred action returns to your lists after its Defer time; Ariadne does not start an agent or send a notification.

## Use cases: ask your AI

Use your own words. For example:

- “Keep this for me: I may clear out the family house, but haven't decided how much.”
- “Build a GTD routine with me: capture, clarify, organize and review. Keep my original notes.”
- “Run my weekly review. Show each project's next action and suggest what to focus on.”
- “Make my routine simpler. Keep the same saved list.”
- “Open my list so I can check and edit it.”
- “Undo the last change.”

See [use cases and example prompts](docs/usage/use-cases.md) for capturing concerns, organizing projects, building a GTD routine, reviewing progress and collecting inputs from other tools. You can adapt the prompts to your own method.

## What your list contains

An **action** holds a title, notes and its current state. Actions can contain smaller actions, belong to a project and have multiple tags. Dates, order and flags help express your intent. Saved **perspectives** let you revisit a selection of the same actions without copying them. Unclassified concerns can stay in Inbox.

See [Product and usage](PRODUCT.md) for the meaning of these building blocks.

Ariadne is being evaluated for private individual use and currently works through ChatGPT; other assistants have not been verified. General availability and pricing are undecided. Less management effort and greater peace of mind are intended benefits, not measured results.

## License

Ariadne's source code is released under the [MIT License](LICENSE). Bundled third-party files keep their own licenses.

[Product and usage](PRODUCT.md) · [Architecture](ARCHITECTURE.md) · [Development and verification](docs/development.md)
