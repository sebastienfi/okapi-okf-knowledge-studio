---
type: Insight Layer
title: Insights
description: Server-side interpretation - ranked, typed insights with thresholds and suggested actions.
resource: apps/api/src/schema/insights/thresholds.ts
tags: [analytics, insights, interpretation]
timestamp: 2026-07-09T00:00:00Z
---

`Repository.insights(limit: 20, severityAtLeast, since)` - the one
`@customResolver` field in the API (everything else analytic is `@cypher`).
Thresholds and copy live on the BACKEND so every client (dashboard, /strata skill,
raw GraphQL) gets the same interpretation.

# Architecture

- `InsightsService` fetches bounded top-N rows using the SAME hoisted Cypher bodies
  as the widget fields (`apps/api/src/schema/insights/analytics-queries.ts` is
  interpolated into both the SDL and the service) - interpretation can never drift
  from what the widgets show.
- `deriveInsights(inputs, thresholds)` is a pure, unit-tested function: raw rows in,
  ranked insights out. No I/O; the clock is injected (`now`) so tip-age checks stay
  testable.
- Cost: selecting `insights` alongside the widget fields re-runs up to five bounded
  reads (~2x on hotspots/coupling/contributors per dashboard load). Accepted at POC
  scale; materialization is the documented fix.

# Schema (per insight)

`code`, `severity` (INFO | WARNING | CRITICAL), `title`, `detail` (names the concrete
entity + metric), `suggestedAction` (framed as a consideration, never a
prescription), `entityKind` + entity fields (`filePath`, `filePathB`, `branchName`,
`authorEmail/Name`), `metricLabel` (compact display, e.g. `84% · 12x`), `metrics`
(raw driving values), `score` (ranking only - NOT comparable across repos).

# Codes and default thresholds

| Code | Source | WARNING | CRITICAL |
|---|---|---|---|
| HIGH_CHURN_HOTSPOT | [file hotspots](/analytics/file-hotspots.md) | >= 20 commits or >= 1500 churn (floor: 8 commits) | >= 50 commits or >= 5000 churn |
| STRONG_LOGICAL_COUPLING | [code coupling](/analytics/code-coupling.md) | score >= 0.5 and >= 5 co-changes | score >= 0.8 and >= 8 co-changes |
| BUS_FACTOR_RISK (file + repo) | [bus factor](/analytics/bus-factor.md) | solo/near-solo file >= 8 commits; repo bus factor 1 | solo file >= 20 commits; repo top share >= 0.75 (sole contributor = INFO) |
| BRANCH_DRIFT | [branch drift](/analytics/branch-drift.md) | >= 30 behind or >= 50 ahead | >= 200 behind, or >= 30 behind with tip > 90 days old |

Thresholds are one tunable config (`INSIGHT_THRESHOLDS`) - calibration on real repos
is a one-place change.

# Consumers

Health card + inline widget hints in the [dashboard](/systems/web.md); the
[/strata skill](/systems/strata-skill.md)'s analysis step.
