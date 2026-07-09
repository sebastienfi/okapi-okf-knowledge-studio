---
type: Graph Relationship
title: HAS_COMMIT / HAS_FILE / HAS_BRANCH
description: Per-label repository membership edges (no generic IN_REPO).
resource: apps/api/src/schema/type-defs.ts
tags: [graph-model]
timestamp: 2026-07-09T00:00:00Z
---

`(Repository)-[:HAS_COMMIT]->(Commit)`, `(Repository)-[:HAS_FILE]->(File)`,
`(Repository)-[:HAS_BRANCH]->(Branch)`. No properties.

# Why per-label types instead of one generic edge

A single shared `IN_REPO` type makes [Repository](/model/repository.md) a dense node
whose expansions scan ALL member edges and then post-filter by label; per-label types
keep each expansion cheap and make raw Cypher self-documenting
(`MATCH (this)-[:HAS_COMMIT]->(c:Commit)` reads exactly as intended).

# Write discipline

Ingestion invariant 3: the membership edge is written in the SAME batch as the node
it points to. The [collaboration](/analytics/collaboration.md) analytic anchors via
`HAS_FILE` (not `HAS_COMMIT`), so a lagging edge type would silently desync that
widget from the others. See the
[ingestion contract](/contracts/ingestion-contract.md).
