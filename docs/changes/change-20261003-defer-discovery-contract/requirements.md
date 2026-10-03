---
change: change-20261003-defer-discovery-contract
role: requirements
---

# Requirements

For `kind=defer`, discovery must distinguish a calendar `date` with explicit `timezone` from an offset-bearing `until` instant. Date and until are mutually exclusive. Date-only Defer remains 09:00 in the explicit timezone. Preview and apply reject mixed inputs and unknown fields. Existing valid operations, schemaVersion, revision, receipt and Undo semantics remain unchanged.

A fresh caller receives README prompts and deployed tool/Skill guidance, chooses tool arguments itself, and executes against the existing HTTP Worker with its Wrangler local D1 binding. It must resolve October 10 in Asia/Tokyo using date plus timezone without the previously observed until-date error. No test binding substitution is permitted.
