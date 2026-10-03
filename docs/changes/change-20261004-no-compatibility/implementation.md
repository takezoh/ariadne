---
change: change-20261004-no-compatibility
role: implementation
---

Removed changed-field-only required-name checks and the alternate acknowledgment implementation. Current acknowledgeDraft pure port is required. accept and receipt-refresh require complete snapshots; invalid replies retain previous state. Shared fake fixtures now explicitly provide current wire arrays. Removed current architecture legacy guarantees; historical change packages remain immutable.

Autosave and draft acknowledgment are required current pure ports; their absent-model execution and equality substitutes were removed. Current fixtures supply these ports explicitly, and typing during unknown outcomes retains newer proposals while writes remain gated. Backend strict current-schema scope is separately authored and recorded in its artifact; forward migration 0015 is prepared only and has not been executed against any database.
