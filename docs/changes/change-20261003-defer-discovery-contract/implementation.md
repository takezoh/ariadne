---
change: change-20261003-defer-discovery-contract
role: implementation
---

# Implementation

MCP change schemas conditionally expose the two Defer payload forms with required fields, patterns and mutual exclusion. Tool descriptions, initialize/snapshot guidance and operation Skill references provide concrete date and instant examples and instruct callers to commit the resolved preview payload. Other change kinds keep generic payload schemas.

Date-only preview validates its original keys and rejects date/instant mixtures before converting to an instant; normalization must not discard invalid fields. No migration, binding replacement or hosted deployment is needed.
