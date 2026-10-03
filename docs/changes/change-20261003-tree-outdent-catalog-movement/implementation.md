---
change: change-20261003-tree-outdent-catalog-movement
role: implementation
---

# Implementation

A closed pure tree-drop model receives measured row/title geometry and full semantic ancestry. Center targets preserve classification; row edges use relative horizontal movement and explicit root-left reachability to select containment depth. This also works when responsive indentation is capped. Final visible mixed Action row edges permit catalog root detach without an empty region. DOM adapters preserve native/pointer geometry and render the exact depth feedback. Catalog drag remains single-object; Action selection remains Shift-contiguous by occurrence.

Project outline order uses durable order/name/UUID; Tag order remains name/UUID. Catalog movement uses a dedicated typed owner-queue branch, flushes earlier catalog proposals, checks relevant source/destination structure, and retains exact unknown writes. Name/description proposals remain separate from movement and survive replay. Space opens the compact Move chooser; Escape restores source focus.

The additive 0013 migration introduces Project order with default zero, preserving existing alphabetical ties and populated owners. Existing direct project_move remains accepted; relative placement is strict and authoritative in the domain. Changed destination peers receive revision and identity markers for safe Undo. Historical receipts lacking order are handled only at historical Undo comparison/restoration, while current invalid Project order is rejected. Backend native implementation owns these changes.

Native Profiles are used directly; development-loop kernel acceptance is not claimed.
