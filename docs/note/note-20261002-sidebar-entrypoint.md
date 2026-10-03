---
id: note-20261002-sidebar-entrypoint
kind: note
title: Launch Ariadne from the sidebar
status: published
created: '2026-10-02'
tags: []
owners: []
relations: []
source_paths: []
summary: Sidebar entry-point declaration, deployment and outstanding acceptance items as of 2026-10-02.
updated: '2026-10-03'
---

# Launch Ariadne from the sidebar

Added `openai/ui.entrypoints` with `global` and `thread` to the `_meta` of `ariadne_open`. Declared that the existing `tasks-v3.html` can open from the full-screen sidebar and the panel beside a conversation. Did not add an entry point to the verification fixture. No changes to persistence, DB or access permissions.

Official reference: https://developers.openai.com/plugins/build/extensions (Sidebar apps). Apply connection information by refreshing the existing Plugin.

Typecheck and Sites checkout build succeeded. Sites source commit: `1bce06ecab6e4774d84fa538b857969784d78d1b`. Deployment to the existing owner-only Site: `appgdep_6abfbb42c0748191bbe07f1b45854a6e`. Verify sidebar display and launch on a real device after refreshing the connection. Unauthenticated HTTP discovery is rejected with 401; do not relax access to test it.
