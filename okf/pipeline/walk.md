---
type: Pipeline Stage
title: Walk
description: Enumerate every `.md` file under the bundle root; symlinks are not followed.
resource: packages/core/src/walk.ts
tags: [pipeline, parser]
timestamp: 2026-07-09T00:00:00Z
---

The first stage lists the bundle's files with `fast-glob` (`**/*.md`), sorted
for deterministic output. Symlinks are not followed - a bundle is a plain
directory tree, and following links out of it would blur the bundle boundary.

Everything else in the pipeline operates on this file list; a file that is not
`.md` is invisible to Okapi (though the server can still serve it as a raw
asset for images referenced from markdown).

Each discovered file's path becomes its identity downstream - see
[Frontmatter](/pipeline/frontmatter.md) for the next stage.
