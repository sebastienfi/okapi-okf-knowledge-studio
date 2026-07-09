---
type: Metric
title: Top contributors
description: Ranked contributor leaderboard with commit share and first/last activity.
resource: apps/api/src/schema/insights/analytics-queries.ts
tags: [analytics, contributors]
timestamp: 2026-07-09T00:00:00Z
---

`Repository.topContributors(limit: 10, since, until)` - a `@cypher` field on
[Repository](/model/repository.md).

# Schema (per row)

| Field | Meaning |
|---|---|
| `email`, `name` | [Author](/model/author.md) identity (name = most-recent-commit display name) |
| `commitCount` | commits authored in the window |
| `additions` / `deletions` | from the denormalized [Commit](/model/commit.md) sums |
| `firstCommitAt` / `lastCommitAt` | activity span in the window |
| `commitShare` | this contributor's fraction of ALL commits in the window (sums to 1.0 across all contributors, not just the returned top N) |

Windowed by the [analysis window](/analytics/analysis-window.md).

# Consumers

The leaderboard (commit-share bars) in the [dashboard](/systems/web.md), and the
repo-level [bus factor](/analytics/bus-factor.md) computation inside
[insights](/analytics/insights.md).
