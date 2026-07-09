---
type: Metric
title: Directory ownership
description: Per-directory activity and author dominance; feeds the ownership treemap.
resource: apps/api/src/schema/type-defs.ts
tags: [analytics, ownership, knowledge-silo]
timestamp: 2026-07-09T00:00:00Z
---

`Repository.directoryOwnership(limit: 100, since, until)` - a `@cypher` field on
[Repository](/model/repository.md). The knowledge map: where does work happen, and
who dominates each area.

# Schema (per row)

| Field | Meaning |
|---|---|
| `directory` | the materialized [File](/model/file.md).directory string (`""` = repo root; no Directory nodes exist) |
| `commitCount` | distinct commits touching the directory in the window |
| `churn` | summed additions + deletions over the directory's [MODIFIED](/model/modified.md) edges |
| `authorCount` | distinct authors |
| `topAuthorName` / `topAuthorShare` | the dominant author and their fraction of the directory's commits - the silo signal (treemap color) |

# Semantics

- Deleted files are excluded (`existsAtHead`), so the map reflects today's tree.
- Correctness of "sum over per-author distinct commits = distinct commits" rests on
  the one-[AUTHORED](/model/authored.md)-edge-per-commit invariant.
- Grouping is flat by dirname string, not hierarchical rollup - `src/a` and
  `src/a/b` are separate rows.
- Windowed by the [analysis window](/analytics/analysis-window.md).

# Consumers

Ownership treemap in the [dashboard](/systems/web.md), colored by `topAuthorShare`.
