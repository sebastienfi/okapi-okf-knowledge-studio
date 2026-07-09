---
type: Graph Node
title: Branch
description: A Git ref pointing at its tip commit, carrying denormalized drift-vs-default metrics.
resource: apps/api/src/schema/type-defs.ts
tags: [graph-model, branch-drift]
timestamp: 2026-07-09T00:00:00Z
---

# Schema

| Property | Type | Notes |
|---|---|---|
| `id` | ID! | `<repoId>:<name>` ([identity](/model/identity.md)) |
| `name` | String! | local + remote-tracking refs, `origin/` stripped and deduped; the detached-HEAD pseudo-ref is skipped (ingestion invariant 8) |
| `isDefault` | Boolean! | at most one `true` per repo; the drift baseline (the default is 0/0) |
| `aheadCount` | Int! | commits on this branch that the default lacks |
| `behindCount` | Int! | commits on the default that this branch lacks - the integration-risk signal |
| `tipCommittedAt` | DateTime! | tip COMMITTER date (staleness signal; note [Commit](/model/commit.md).committedAt is the AUTHOR date) |

# Drift is computed at ingest, never per-query

Ingestion invariant 9: git computes ahead/behind for every ref in ONE revision walk
(`git for-each-ref '%(ahead-behind:<tipHash>)'`, git >= 2.41, with a
`rev-list --left-right --count` fallback), based by **hash** not name (remote-only
branches are ambiguous by name). A query-time `PARENT*` merge-base would be
O(branches x history) on real repos. Unreachable tips (shallow clones) degrade to
0/0, never fail the ingest.

Default-branch detection cascade: `origin/HEAD` -> `main` -> `master` ->
checked-out branch -> branch at HEAD's commit -> lexicographically first.

Branches are `DETACH DELETE`d and rebuilt from refs on every re-ingest (else
[POINTS_TO](/model/points-to.md) tips accumulate). A graph ingested before the drift
properties existed errors on `branches { ... }` until re-ingested.

# Relationships

- `-[:POINTS_TO]->` [Commit](/model/commit.md) (the tip) - [POINTS_TO](/model/points-to.md)
- `<-[:HAS_BRANCH]-` [Repository](/model/repository.md)

Consumed by [branch drift](/analytics/branch-drift.md) and the BRANCH_DRIFT
[insight](/analytics/insights.md).
