---
id: issue-20261003-legacy-note-frontmatter
kind: issue
title: Missing frontmatter in existing notes fails documentation lint
status: done
created: '2026-10-03'
issue_type: bug
tags: []
owners: []
relations:
- {type: originatedFrom, target: change-20261003-effect-boundaries-test-harness}
subject_paths:
- docs/note/note-20261002-sidebar-entrypoint.md
- docs/note/note-20261002-work-benefit-acceptance.md
summary: Missing frontmatter in two existing notes prevents repository-wide documentation lint.
disposition_target: change-20261003-effect-boundaries-test-harness
updated: '2026-10-03'
---

# Missing frontmatter in existing notes

## Symptom

Repository-wide documentation lint failed because two existing notes lacked frontmatter, preventing formal closure of a change from being verified.

## Evidence

The dev-docs CLI `lint` reported `frontmatter_missing` for `docs/note/note-20261002-sidebar-entrypoint.md` and `docs/note/note-20261002-work-benefit-acceptance.md`. Both files predated the side-effect-boundary change and were not part of its code change scope.

## Context required to start

Preserve the content and dates of historical acceptance results while bringing the documents into the managed format. Do not treat successful isolated lint of a change package as repository-wide lint success.

## Resolution

Following the commit hook, generated and added frontmatter to both notes through the CLI. The original body was preserved byte for byte. A separate metadata repair approved by the user resolved a closure gap in the earlier MVP, and normal documentation lint passed. The existing document's conformance issue is separate from resolving this note-format issue.
