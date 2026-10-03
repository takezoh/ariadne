---
change: change-20261003-floating-header-navigation
role: verification
---

# Verification

Targeted UI suite passed 114 tests with zero failures, cancellations, skips or TODOs. New permanent tests verify floating navigation and display selected states, trigger focus, Tab/Escape/outside close, unavailable saved Perspective references, removed duplicates, icon-only Refresh, Action/catalog IME and latest navigation priority, zero-write Cancel, and exact unknown header creation replay with newer raw text/navigation. Existing geometric gutter rejection regression now targets the actual navigation popup after sidebar removal. Final whole check passed 305 tests with zero failures, cancellations, skips or TODOs, including lint and typecheck. Independent native UI review approved 114 UI tests and six actual responsive/theme browser cases. Independent creation/recovery review passed ten Action/catalog IME, newer navigation, exact unknown and parent-context cases; native gutter movement passed the unchanged twelve-case layout matrix. Final build exited successfully; both normal and verification built resources passed. Fresh actual read-only Web preview at 320, 390 and 1280 pixels passed with no JavaScript errors. HTML actually served by that preview then passed twelve trusted native Action/Project/Tag gutter-center/final-edge cases at 390/1280 through isolated shared-domain memory ports: exact root parent, append rank, classification preservation and one operation. Actual local DB data was not mutated by preview acceptance.

Hosted D1, ChatGPT Work, deployment and development-loop kernel acceptance are not claimed. No machine Git scope acceptance is claimed.
