---
type: Metric
title: Commit activity
description: Commit/churn time series in UTC-normalized day/week/month buckets.
resource: apps/api/src/schema/type-defs.ts
tags: [analytics, activity, time-series]
timestamp: 2026-07-09T00:00:00Z
---

`Repository.commitActivity(bucket: DAY | WEEK | MONTH = WEEK, since, until,
authorEmail)` - a `@cypher` field on [Repository](/model/repository.md).

# Schema (per point)

`bucketStart` (UTC-normalized DateTime), `commitCount`, `activeAuthors`,
`additions`, `deletions` (from the denormalized [Commit](/model/commit.md) sums -
the query never touches [MODIFIED](/model/modified.md) edges).

# Semantics

- **Buckets are UTC-normalized before truncation**
  (`datetime({datetime: c.committedAt, timezone: 'Z'})`): `datetime.truncate`
  otherwise preserves each commit's original TZ offset and one calendar week
  fragments into per-offset buckets (proven live with +02:00/Z/-08:00 commits).
- **Zero-commit buckets are absent by design** - the client zero-fills. The web app's
  `zeroFillActivity` rebuilds the grid in UTC with Monday weeks
  (`weekStartsOn: 1`) to match Neo4j's truncation; it is the dashboard's one
  unit-tested piece.
- Optional `authorEmail` narrows the series to one contributor.
- Windowed by the [analysis window](/analytics/analysis-window.md).

# Consumers

Two synced small-multiple panels in the [dashboard](/systems/web.md) (commits vs
churn share a `syncId`; never dual-axis).
