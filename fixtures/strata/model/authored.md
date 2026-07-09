---
type: Graph Relationship
title: AUTHORED
description: Author-to-Commit edge; exactly one per commit, the invariant every analytic depends on.
resource: apps/api/src/schema/type-defs.ts
tags: [graph-model, invariant]
timestamp: 2026-07-09T00:00:00Z
---

`(Author)-[:AUTHORED]->(Commit)`. No properties.

# The load-bearing invariant

**Exactly one AUTHORED edge per commit**, written in the SAME transaction as the
commit ([ingestion contract](/contracts/ingestion-contract.md), invariant 1):

- A missing edge silently drops the commit from every analytic (they all traverse it).
- A duplicate edge silently double-counts.
- [Directory ownership](/analytics/directory-ownership.md) additionally relies on it
  for "sum of per-author distinct commits = distinct commits".

Post-ingest sanity check (must return 0):

```cypher
MATCH (c:Commit) WHERE COUNT { (c)<-[:AUTHORED]-() } <> 1 RETURN count(c)
```

# Scope

The model is author-only by decision: committer identity and `Co-authored-by`
trailers are cut (additive later as a `COMMITTED` edge). Every EM question served by
the analytics is about authorship. See [Author](/model/author.md) for identity noise.
