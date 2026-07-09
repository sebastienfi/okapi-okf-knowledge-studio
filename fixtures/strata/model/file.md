---
type: Graph Node
title: File
description: A repo-scoped file path with materialized directory and exists-at-HEAD flag.
resource: apps/api/src/schema/type-defs.ts
tags: [graph-model]
timestamp: 2026-07-09T00:00:00Z
---

# Schema

| Property | Type | Notes |
|---|---|---|
| `id` | ID! | `<repoId>:<path>` ([identity](/model/identity.md)) |
| `path` | String! | repo-relative path; ingestion runs `--no-renames`, so a rename is delete + add |
| `directory` | String! | materialized dirname (`""` = repo root); real Directory nodes were deliberately cut - the string gives cheap grouping and feeds [directory ownership](/analytics/directory-ownership.md) |
| `extension` | String | null when the file has no extension |
| `existsAtHead` | Boolean! | set from one `git ls-tree -r HEAD` pass at ingest; `false` = deleted or renamed away. Reset to `false` then re-set on every re-ingest |

`existsAtHead` keeps long-deleted files out of [hotspots](/analytics/file-hotspots.md)
by default (a real product wart otherwise) and out of the ownership treemap.

# Relationships

- `<-[:MODIFIED {additions, deletions}]-` [Commit](/model/commit.md)
  ([MODIFIED](/model/modified.md))
- `<-[:HAS_FILE]-` [Repository](/model/repository.md)

# Drill-down field

`File.coupledFiles(limit, maxCommitSize)` is a `@cypher` field returning the files
that change in the same commits as this one (same mega-commit noise filter as
[code coupling](/analytics/code-coupling.md); its score is
`coChanges / thisFileCommits`, so 1.0 = always changes together).
