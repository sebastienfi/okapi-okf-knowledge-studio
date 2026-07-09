---
type: Metric
title: File hotspots
description: Top files by change frequency or churn, with bus-factor signals per file.
resource: apps/api/src/schema/insights/analytics-queries.ts
tags: [analytics, hotspots, bus-factor]
timestamp: 2026-07-09T00:00:00Z
---

`Repository.fileHotspots(limit: 10, since, until, orderBy: COMMITS | CHURN,
includeDeleted: false)` - a `@cypher` field on [Repository](/model/repository.md).

# Schema (per row)

| Field | Meaning |
|---|---|
| `path`, `directory`, `existsAtHead` | file identity ([File](/model/file.md)) |
| `commitCount` | distinct commits touching the file in the window |
| `additions` / `deletions` / `churn` | line stats summed over [MODIFIED](/model/modified.md) edges (churn = additions + deletions); split kept for the adds-vs-dels scatter |
| `authorCount` | bus-factor signal: 1 = single point of failure |
| `topAuthorShare` | bus-factor signal: 1.0 = one person owns every change |

# Semantics

- Windowed by the [analysis window](/analytics/analysis-window.md); null = all history.
- Deleted files are excluded by default (`includeDeleted: false` uses
  `existsAtHead`) - long-dead files would otherwise dominate.
- The two orderings answer different questions: `COMMITS` = change frequency,
  `CHURN` = change volume.
- Binary-file null edge properties are coalesced to 0.

# Consumers

Hotspot table + scatter in the [dashboard](/systems/web.md); the
[bus factor](/analytics/bus-factor.md) file-level signals; input rows for the
HIGH_CHURN_HOTSPOT and BUS_FACTOR_RISK [insights](/analytics/insights.md).
