---
change: change-20261003-minimal-autosave-ui
role: requirements
---

# Requirements

Normal editing saves after a short trailing debounce or blur, without Save buttons or Review dialog. Discrete changes save directly; incomplete Order/date inputs remain local. IME final text is bound to its original Action before shared inspector selection changes. Navigation and Back/Close flush pending valid edits without discarding drafts. Add remains one control; allowed contexts show no explanatory prose.

Saving A while typing B keeps B visible and editable; only captured fields are acknowledged. Owner-wide writes serialize. Unknown outcomes retain exact IDs/arguments and later drafts; lookup/replay resumes the lane only after authoritative refresh. External touched-field changes pause only the affected target for inline Use my edits / Use saved. Unrelated owner revisions do not create overwrite consent. Cascade counts/date warning meaning and Undo remain available without modal confirmation.

Counterexamples: intermediate IME writes, busy disabling typing, stale queued fields overwriting caller corrections, fresh retry IDs, silent conflict rebase, or falsely reporting Saved.
