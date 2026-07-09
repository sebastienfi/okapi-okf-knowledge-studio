---
type: Graph Relationship
title: CONTRIBUTES_TO
description: Author-to-Repository edge materialized at ingest for cheap contributor listings.
resource: apps/api/src/schema/type-defs.ts
tags: [graph-model]
timestamp: 2026-07-09T00:00:00Z
---

`(Author)-[:CONTRIBUTES_TO]->(Repository)`. No properties. `MERGE`d at ingest.

# Why materialized

[Authors are global](/model/author.md) (id = email across all repos). This edge makes
"contributors of repo X" a *generated, filterable* GraphQL relationship
(`Repository.contributors` / `Author.repositories` / `contributorsConnection.totalCount`)
instead of a custom resolver that would traverse
`(Author)-[:AUTHORED]->(Commit)<-[:HAS_COMMIT]-(Repository)` on every call.

It is derivable data, so the single-writer rule keeps it safe: only the
[ingestion service](/systems/ingestion-service.md) writes it, in the same run that
writes the commits it summarizes.
