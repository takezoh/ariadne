---
change: change-20261003-english-minimal-ui
role: implementation
---

# Implementation

The shared widget uses a continuous neutral shell, a quiet rail, stronger list heading, plain row metadata, bounded child indentation and details only after selection. Narrow details appear before the list with a Back control and focus return; closing details retains draft proposals. Completion circles are unchecked for unfinished actions. Direct flags stay visible when set and remain accessible on focus and touch.

The generated 24px stroke SVG family adds matching empty/checked completion, Back and Close icons. Controls expose English accessible names. The English UI uses explicit timezone in date diagnostics and review. Stored input remains exact, including non-English text.

Pure presentation maps typed error codes and current Due/Defer warning fields to English meaning. Raw server message strings are not displayed by the widget. Unknown warning codes receive an English review warning. Definite conflicts request refresh and review; unknown outcomes preserve exact request lookup/replay.

The Web preview attaches its message listener before setting the iframe srcdoc through the DOM effect, preventing an initialization request from preceding listener registration and avoiding differing server/client serialized srcDoc. It keeps the same application relay and authentication path.

Existing save groups, controller semantics, nine-field drafts, IME/caret behavior, dropped parent choices, revision handling, exact replay and Undo are preserved. No domain, storage, dependency, infrastructure or deployment change is included.
