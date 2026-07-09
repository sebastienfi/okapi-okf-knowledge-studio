---
type: Metric
title: Bus factor
description: Knowledge-concentration signals at file and repository level.
resource: apps/api/src/schema/insights/thresholds.ts
tags: [analytics, bus-factor, knowledge-silo]
timestamp: 2026-07-09T00:00:00Z
---

Two levels, both derived rather than stored.

# File level (knowledge silo)

From [file hotspots](/analytics/file-hotspots.md) rows: `authorCount == 1` or
`topAuthorShare` near 1.0 marks a single point of failure. The BUS_FACTOR_RISK
[insight](/analytics/insights.md) fires when a file with >= 8 commits is solo-authored
(or near-solo: share >= 0.9 with <= 2 authors); solo with >= 20 commits escalates to
CRITICAL. Deleted files carry no silo risk (excluded via `existsAtHead`).

# Repository level

`busFactor(contributors)` = the fewest contributors whose combined `commitShare`
reaches 50%, computed server-side (pure function in
`apps/api/src/schema/insights/thresholds.ts`) from
[top contributors](/analytics/top-contributors.md) rows.

When the bus factor is 1:

| Situation | Severity |
|---|---|
| repo has exactly one contributor in the window | INFO ("single-contributor repository") |
| top share >= 0.75 | CRITICAL |
| otherwise | WARNING |

# Framing

Copy is a consideration, never a prescription: the engine sees change patterns, not
root causes (a solo-maintained utility can be perfectly healthy). See
[insights](/analytics/insights.md) for the delivery mechanism.
