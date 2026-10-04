# Ariadne

## Keep less in your head. Your AI keeps track of the rest.

**Design your own workflow with your AI—GTD, a simple daily list or something entirely new. It captures, organizes and reviews your tasks your way, while you stay in control.**

Tell your AI whatever is on your mind—a commitment, a worry, a half-formed plan. It saves each one as a task, fits it into the workflow you designed together and brings back what matters when you ask. You spend less energy remembering and organizing, and more on doing, deciding and resting.

## Get it out of your head

Hand over commitments, concerns and unfinished thoughts as they are. Your original words are kept, and you do not have to pick a deadline, a category or even a commitment first. Put aside what you do not need right now with Defer; the task and its deadline stay saved and return to your list at the time you choose.

## Design a workflow that fits you

Ariadne comes with no built-in method, so the workflow is yours to design. Follow GTD, keep a simple daily list, or invent a system of your own together with your AI. Your method lives in your prompts, not in the app. Projects, tags, order, flags, dates, smaller steps inside a task and saved views are building blocks you combine as you like. Change your approach whenever you want—your tasks stay where they are.

## Let your AI do the upkeep

Capturing, clarifying, sorting into projects, weekly reviews, choosing what to focus on next: ask your AI, and it does the work inside your system. Agents you set up can also bring in commitments from Slack or email and file them as tasks. Your attention goes to the tasks themselves, not to maintaining the list.

## Stay in control—without watching every change

Your conversation and the dedicated UI show the same tasks. Check anything and fix it directly, in either place. You do not have to watch every change your AI makes: an edit based on an outdated list never overwrites newer ones, the dedicated UI keeps your unsaved edits, retrying a request never creates a duplicate, a lost response can be checked or resent exactly, and Undo never quietly erases a correction made afterward.

## Who it is for

Ariadne is for people who want their AI to handle the upkeep of their tasks—especially if keeping a to-do app going has felt like work in itself. It also suits people who practice GTD or run their own system, and people who build their own agents or scheduled workflows.

Ariadne is a personal task list. It is not a team project management tool, and it does not plan your calendar or send reminders.

## Add Ariadne to ChatGPT

Ask ChatGPT Work to read [INSTALL.md](INSTALL.md) and perform the installation:

```text
Read https://github.com/takezoh/ariadne/blob/main/INSTALL.md and install Ariadne for me.
```

After connecting, ask ChatGPT to show your tasks and open the list.

## Use cases: ask your AI

Use your own words. For example:

- “Keep this for me: I may clear out the family house, but haven't decided how much.”
- “Build a GTD routine with me: capture, clarify, organize and review. Keep my original notes.”
- “Set up a simple routine with me: each morning, show me three things to focus on.”
- “Run my weekly review. Show each project's next action and suggest what to focus on.”
- “Make my routine simpler. Keep the same saved list.”
- “Open my list so I can check and edit it.”
- “Undo the last change.”

See [use cases and example prompts](docs/usage/use-cases.md) for capturing concerns, organizing projects, building a GTD routine, reviewing progress and collecting inputs from other tools. You can adapt the prompts to your own method.

## How it works

Ariadne is where your tasks live; your AI does the thinking. Ariadne has no AI of its own: your prompts, ChatGPT or an agent you set up decide what to capture, how to organize it and when to act. Ariadne keeps every task safe to change and easy to correct through its tools and dedicated UI. It does not send reminders, plan your calendar or run in the background; a deferred task simply returns to your list after its Defer time.

## What your list contains

Each task is saved as an **action**, the name used in the dedicated UI and tools. An action holds a title, notes and its current state. Actions can contain smaller actions, belong to a project and have multiple tags. Dates, order and flags help express your intent. Saved **perspectives** let you revisit a selection of the same actions without copying them. Unclassified concerns can stay in Inbox.

See [Product and usage](PRODUCT.md) for the meaning of these building blocks.

Ariadne is being evaluated for private individual use and currently works through ChatGPT; other assistants have not been verified. General availability and pricing are undecided. Less management effort and greater peace of mind are intended benefits, not measured results.

## License

Ariadne's source code is released under the [MIT License](LICENSE). Bundled third-party files keep their own licenses.

[Product and usage](PRODUCT.md) · [Architecture](ARCHITECTURE.md) · [Development and verification](docs/development.md)
