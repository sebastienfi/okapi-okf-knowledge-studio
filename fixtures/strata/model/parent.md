---
type: Graph Relationship
title: PARENT
description: Commit lineage edge with parent order; forms the commit DAG.
resource: apps/api/src/schema/type-defs.ts
tags: [graph-model, lineage]
timestamp: 2026-07-09T00:00:00Z
---

`(child:Commit)-[:PARENT {order}]->(parent:Commit)`. The `Commit.parents` GraphQL
field follows it OUT; `Commit.children` follows it IN.

# Schema

| Edge property | Type | Notes |
|---|---|---|
| `order` | Int! | Git parent order: 0 = first parent (mainline) - enables first-parent traversals; populated free from `%P` |

# DAG semantics

- 0 parents = root commit; 2+ parents = merge ([Commit](/model/commit.md).isMerge is
  stored, not derived, so generated filters can exclude merges).
- Branch membership is NOT materialized: reachability derives from `PARENT*` starting
  at a [POINTS_TO](/model/points-to.md) tip (materializing it creates supernodes and
  goes stale).

# Write discipline

Ingestion invariant 2 (two-pass): all Commit nodes + properties are written first,
PARENT edges second via `MATCH` on BOTH endpoints - never `MERGE`-creating
placeholder nodes, so no property-less ghosts exist mid-ingest. Unknown parents in
shallow clones are skipped, not fabricated. See the
[ingestion contract](/contracts/ingestion-contract.md).

Exposed order via `parentsConnection { edges { properties { order } } }`.
