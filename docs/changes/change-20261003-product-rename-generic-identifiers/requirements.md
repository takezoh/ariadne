---
change: change-20261003-product-rename-generic-identifiers
role: requirements
---

<!-- lifecycle is owned by change.md -->

# Requirements

## Source and approval

The user requested a product rename in this repository conversation on 2026-10-03. When asked for the scope, the user selected the option that also renames tool names, resource URIs, the Skill name and the package name, accepting the disclosed breaking effects, and directed that source code contain neither product name but generic names.

## Requirements

- R1: Current documentation outside historical records shall use the current product name.
- R2: Source code, tests, scripts, configuration, MCP tool names, UI resource URIs and the Skill shall contain no product name. Applied migrations 0005 and 0006 keep their recorded identifiers because applied migrations are immutable.
- R3: MCP tools shall be published under generic names: open_actions, list_actions, add_action, rename_action and open_verification replace the five product-prefixed names. Other tool names are unchanged.
- R4: UI resources shall use ui://action-tools/actions-v4.html and ui://action-tools/actions-verification-v4.html.
- R5: Generic metadata shall be used for serverInfo (action-tools), UI appInfo (action-tools-ui), Web preview hostInfo (web-preview), package name (action-tools) and the Skill (skills/action-tools, name action-tools). Visible UI and tool titles shall use generic Japanese labels.
- R6: When an operations row breaks revision continuity, the database shall raise the generic revision_conflict marker, and the D1 adapter shall classify that marker as a conflict while preserving replay, Undo and owner isolation.
- R7: tools/list shall contain exactly the generic tool set, without aliases for earlier names.

## Breaking effects and migration

- Callers, prompts and installed Skills that name earlier tools fail with unknown_tool until updated.
- Hosts must refetch tools and resources; earlier resource URIs are no longer served.
- Receipts bind the tool name. An unknown outcome recorded under an earlier write tool can be checked with operation_status or a current read, but an identical resend under the new name is rejected as idempotency_conflict and the earlier name is unknown. Resolve outstanding unknown outcomes before switching.
- Conflict classification matches revision_conflict, which the earlier trigger message also contains, so the order of migration 0012 and Worker deployment does not misclassify conflicts.

## Non-goals

Renaming the GitHub repository, Sites project, DB binding, worktree paths or hosted plugin listing; editing applied migrations or historical documents; compatibility aliases; hosted migration, deployment, commit or push.
