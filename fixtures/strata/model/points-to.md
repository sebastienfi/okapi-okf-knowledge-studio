---
type: Graph Relationship
title: POINTS_TO
description: Branch-to-tip-commit pointer; reachable history derives from PARENT edges.
resource: apps/api/src/schema/type-defs.ts
tags: [graph-model, branches]
timestamp: 2026-07-09T00:00:00Z
---

`(Branch)-[:POINTS_TO]->(Commit)`. No properties. Refs are pointers: a
[Branch](/model/branch.md) points at its tip; everything reachable from the tip via
[PARENT](/model/parent.md) edges is "on" the branch.

# Consequences

- Branch-to-commit membership edges were deliberately rejected: they create
  supernodes and go stale on every push. Drift metrics that WOULD need reachability
  are instead denormalized on Branch at ingest (invariant 9).
- Ingestion's `git log` runs with `--all` so that every branch tip is guaranteed to
  exist as a [Commit](/model/commit.md) node - otherwise POINTS_TO would dangle.
- On re-ingest, branches (and therefore these edges) are dropped and rebuilt from the
  current refs, so tips never accumulate ([ingestion
  contract](/contracts/ingestion-contract.md), invariant 5).

Exposed as `Branch.head` (OUT) and `Commit.headOf` (IN).
