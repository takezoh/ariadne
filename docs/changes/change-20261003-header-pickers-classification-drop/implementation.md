---
change: change-20261003-header-pickers-classification-drop
role: implementation
---

# Implementation

The closed pure picker model normalizes search-only strings and ranks prefix, substring and subsequence matches with deterministic identity ties. Existing catalog get-or-create and versioned assignment continue as separate serial writes. Overlay dropdowns keep the underlying layout fixed when an outside recovery/control click closes the picker.

Real Chromium title `drag_to` reproduced two independent geometry defects: revealing the selection toolbar shifted rows, and populating live drag feedback above the list shifted them again. Active gesture keeps toolbar geometry stable and feedback lives after the list. List DOM reconstruction is deferred during gestures, touch capture uses the stable list node, and native dragstart/pointercancel/dragover/drop share one frozen request. The actual title rectangle protects its center from edge interpretation. Drop indicators do not create a second operation.

The backend extends existing classification operations with id/ids exclusivity. Every selected Action is validated before one common change path; atomic associations, owner revision, receipts and Undo are reused. No storage/migration change is required. The UI classification lane flushes relevant proposals and tracks captured direct membership baselines. Own earlier acknowledgments update waiting classification intent baselines; unrelated or external changes are not silently rebased.

Native implementation and independent review Profiles are used directly; development-loop kernel execution is not claimed.

Final source is frozen. Local integration and independent review acceptance are complete; see verification.md and evidence/. The sticky header keeps creation and contextual filters accessible after inspector focus and scrolling.
