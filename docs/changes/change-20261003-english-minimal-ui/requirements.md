---
change: change-20261003-english-minimal-ui
role: requirements
---

# Requirements

The user rejected the previous visual presentation and requested an entirely English interface. Historical approval of the prior UI is not evidence for this change.

The shared workspace uses a white canvas, faint navigation rail, near-black typography and one restrained accent. Selection adds a detail panel in wide displays; no empty detail column occupies space. Narrow displays show the focused editor before the list and expose Back to list. Containment uses bounded indentation without changing action order.

All application-authored copy is English: labels, accessibility, errors, review, loading, dates, diagnostics and host-visible metadata. Stored user titles, notes and classification text remain exact.

## Observable scenarios

### UX-01

Given A full display has no selected action, when The workspace loads, then The list takes the available content width and no empty detail card is shown.

Counterexample: A blank editor reserves one third of the content area.

### UX-02

Given The app is narrow or in a sidebar, when The user selects an action, then Its detail region is brought into view, title receives focus, and Back to list is available.

Counterexample: Details are appended far below a long list without a direct return route.

### UX-03

Given Actions exist in distinct scopes, when The user selects Inbox, Flagged, On hold, Later, Completed or Dropped, then Scope labels, heading and empty state are English and selection reflects the authoritative scope.

Counterexample: A renamed scope changes domain filtering or hides on-hold actions from normal view.

### UX-04

Given An action is active or on-hold, when The user examines and activates its completion control, then The control appears unchecked before saving and the existing review describes affected descendants.

Counterexample: Every incomplete row already displays a checkmark.

### UX-05

Given One or more of the nine draft fields differ from saved values, when The host refreshes, the view changes or display mode switches, then Unsaved values and exact input formatting remain; out-of-view proposals have an English access control.

Counterexample: A scope switch or responsive layout erases a date, order, flag or IME input.

### UX-06

Given A submitted write has an unknown outcome, when The UI reports uncertainty, then An English recovery message offers Check result and Retry same request; unrelated writes remain blocked.

Counterexample: The UI says Save failed or retries with a new operation ID.

### UX-07

Given The server returns a known error or date warning, when The message is rendered, then The UI presents English meaning without backend Japanese and preserves exact before/after fields and timezone.

Counterexample: Raw warning.message or error.message appears in the interface.

### UX-08

Given The user uses keyboard, mouse or touch, when They reach the flag control, then The unflagged control is available on hover/focus and always available on touch; a set flag remains visible.

Counterexample: Opacity-only styling leaves an unreachable control or hides a set flag.

## Invariants and limitations

Preserve all nine draft fields, per-group acknowledgement, exact request identity, unknown-response recovery, revision, preview and Undo. Date-only Defer keeps explicit timezone and 09:00 interpretation. User decisions and caller management remain outside this presentation change.

Native requirement/design author and independent design review were used. The standard runtime kernel was not executed and no kernel success is claimed. Local browser evidence does not prove ChatGPT Work acceptance. See [candidate](evidence/design.json) and [independent design review](evidence/design-verdict.json).
