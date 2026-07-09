---
type: Graph Relationship
title: MODIFIED
description: Commit-to-File edge carrying per-change additions/deletions (null for binaries).
resource: apps/api/src/schema/type-defs.ts
tags: [graph-model, churn]
timestamp: 2026-07-09T00:00:00Z
---

`(Commit)-[:MODIFIED {additions, deletions}]->(File)`.

# Schema

| Edge property | Type | Notes |
|---|---|---|
| `additions` | Int (nullable) | null for binary files - `git numstat` prints `-`; null is more honest than 0 |
| `deletions` | Int (nullable) | same |

# Why the payload lives on the edge

Additions/deletions are per-(commit, file) facts; storing them anywhere else forces
double-counting. The [Commit](/model/commit.md) node keeps denormalized SUMS of these
edges (null coalesced to 0) for edge-free activity queries.

# Merge and binary semantics

Ingestion runs plain `git log --numstat --no-renames`:

- **Merge commits print no numstat rows** - a merge has NO MODIFIED edges, and its
  denormalized `additions/deletions/filesChanged` are 0.
- **Binary files print `-`** - the edge exists with null properties; they contribute
  0 to the denormalized sums.
- `--no-renames` means a rename is delete + add (rename paths like
  `src/{a => b}/f.ts` would otherwise mint garbage [File](/model/file.md) nodes).

Exposed in the API via connections, e.g.
`filesConnection { edges { properties { additions deletions } node { path } } }`.
