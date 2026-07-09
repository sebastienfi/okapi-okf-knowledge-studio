---
type: Graph Node
title: Commit
description: One Git commit with denormalized change totals; the center of the graph.
resource: apps/api/src/schema/type-defs.ts
tags: [graph-model]
timestamp: 2026-07-09T00:00:00Z
---

# Schema

| Property | Type | Notes |
|---|---|---|
| `id` | ID! | `<repoId>:<hash>` ([identity](/model/identity.md)) |
| `hash` | String! | full commit hash, indexed for bare-hash lookup across repos |
| `message` | String! | subject line only (`%s`); filterable, sorting disabled (`@sortable(byValue: false)`) |
| `committedAt` | DateTime! | git AUTHOR date, ISO-8601 with the original TZ offset |
| `additions` / `deletions` | Int! | denormalized sums over [MODIFIED](/model/modified.md) edges; binary or merge contributes 0 |
| `filesChanged` | Int! | denormalized count of MODIFIED edges (merge = 0) |
| `isMerge` | Boolean! | stored at ingest (parents >= 2) so generated filters work |

The denormalization is deliberate (single writer makes it safe): it keeps activity
Cypher edge-free, gives [code coupling](/analytics/code-coupling.md) an O(1)
mega-commit filter (`filesChanged <= maxCommitSize`), and generated filters like
`commits(where: { filesChanged: { gt: 50 } })` work out of the box.

# Relationships

- `<-[:AUTHORED]-` [Author](/model/author.md) - exactly one per commit
  ([AUTHORED](/model/authored.md), invariant 1)
- `-[:MODIFIED {additions, deletions}]->` [File](/model/file.md)
- `-[:PARENT {order}]->` Commit (parents) and `<-[:PARENT]-` (children) -
  [PARENT](/model/parent.md); 0 parents = root, 2+ = merge
- `<-[:HAS_COMMIT]-` [Repository](/model/repository.md)
- `<-[:POINTS_TO]-` [Branch](/model/branch.md) (headOf)

**API gotcha:** `@neo4j/graphql` v7 requires list types on ALL relationship fields, so
`Commit.repository` and `Commit.author` are `[...!]!` in the API even though to-one
cardinality is an ingestion invariant. Clients take element `[0]`.
