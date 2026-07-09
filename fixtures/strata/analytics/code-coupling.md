---
type: Metric
title: Code coupling
description: File pairs that change together, scored with a windowed, filtered Jaccard.
resource: apps/api/src/schema/insights/analytics-queries.ts
tags: [analytics, coupling]
timestamp: 2026-07-09T00:00:00Z
---

`Repository.fileCoupling(limit: 10, minCoChanges: 3, maxCommitSize: 50, since)` -
a `@cypher` field on [Repository](/model/repository.md).

# The score

Filtered **Jaccard**: `coChanges / (commitsA + commitsB - coChanges)`, where the
numerator AND both denominators use the same window (`since`) and the same
`maxCommitSize` filter - an unfiltered denominator inverts pair rankings (verified
live). `maxCommitSize` (default 50) drops bulk-refactor noise via the denormalized
[Commit](/model/commit.md).filesChanged, an O(1) check per commit.

# Semantics and bounds

- Pairs deduped by `pathA < pathB`; `minCoChanges` (default 3) is the noise floor.
- Exact denominators are computed only for a candidate pool of the top
  `limit x 10` pairs by raw co-change count, bounding per-request cost on large
  repos. Documented trade-off: a rarely-co-changing pair with a very high Jaccard can
  miss the pool; raise `limit` to widen it.
- `since`-windowed only (no `until`).
- Small repos return `[]` at the defaults - an honest empty state the UI designs for.

# Drill-down

`File.coupledFiles(limit, maxCommitSize)` on a single [File](/model/file.md) uses a
different score: `coChanges / thisFileCommits` (1.0 = the other file changes every
time this one does).

# Consumers

Coupling force graph in the [dashboard](/systems/web.md) (weak gravity, not
forceCenter - disconnected pair-islands repel off-canvas otherwise); the
STRONG_LOGICAL_COUPLING [insight](/analytics/insights.md). Source/test pairs
co-changing is expected and healthy - the insight copy says so.
