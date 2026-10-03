---
change: change-20261003-refined-action-input
role: implementation
---

# Implementation

The pure movement model replaces additive toggles with a contiguous visible interval. DOM pointerdown captures candidate sources without changing the Shift anchor or replacing rows; activation occurs only after threshold. Row/title gestures share existing fingerprint guards, atomic action_move and recovery. Synthetic click suppression expires at pointerup and a new independent pointerdown.

A closed pure calendar factory takes injected timezone formatting. It enumerates local offsets around the chosen date, accepts exactly one matching instant, rejects DST gaps/folds and preserves seconds/milliseconds. Native calendar input effects and explicit timezone formatting stay in the DOM adapter. Invalid proposals are retained in the ordinary action-bound draft and do not dispatch.

Catalog jobs enter the existing serial owner lane with get-or-create, operation ID and frozen name. The generated UUID is verified against resolved result and full snapshot. Assignment follows snapshot acceptance only if the captured desired and saved classification still match. Receipt lookup and exact retry reuse the same callback; full-refresh failure retains the global recovery gate. DOM submission tokens retain newer names and only select a created catalog when original navigation still matches.

Backend, database, migrations and infrastructure are unchanged. Native implementation Profile execution does not claim development-loop kernel execution.

Local implementation and integration acceptance are complete. Source is frozen. Test/review/browser/build evidence is retained in evidence/; infrastructure and backend source were not changed by this package.
