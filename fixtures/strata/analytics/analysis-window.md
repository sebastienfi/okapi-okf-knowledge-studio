---
type: Convention
title: Analysis window
description: The since/until windowing semantics every metric shares (null = all history).
resource: apps/api/src/schema/type-defs.ts
tags: [analytics, convention, windowing]
timestamp: 2026-07-09T00:00:00Z
---

Every windowed analytic takes `since` / `until` DateTime arguments, and
**`$since IS NULL` means ALL history**. There is NO server-side default window
anywhere - a claim of a "24-month default" was once fabricated by a planning
subagent and refuted against the code; verify against `type-defs.ts` if in doubt.

# Which surfaces are windowed

| Windowed (since/until) | Unwindowed (always all history / "now") |
|---|---|
| [file hotspots](/analytics/file-hotspots.md), [commit activity](/analytics/commit-activity.md), [collaboration](/analytics/collaboration.md), [top contributors](/analytics/top-contributors.md), [directory ownership](/analytics/directory-ownership.md), [insights](/analytics/insights.md); [code coupling](/analytics/code-coupling.md) takes `since` only | [branch drift](/analytics/branch-drift.md), KPI totals (connection `totalCount`s), `filesConnection.totalCount` (counts ALL paths incl. deleted) |

# Server-side gotcha

DateTime arguments reach `@cypher` statements AND `@customResolver` resolvers as ISO
**strings** (the scalar's parseValue returns the input). Every statement wraps them:
`datetime($since)`. An unwrapped `c.committedAt >= $since` compares datetime to
string, yields null, and the analytic silently returns `[]`. Generated filters
(`committedAt: { gte: ... }`) are NOT affected.

# Client-side convention

The [dashboard](/systems/web.md) drives the window from a `?win=` URL param and
derives `since` render-stably via `startOfDay(subMonths(...))`: urql keys operations
on stringified variables, so a fresh `new Date().toISOString()` per render causes an
infinite refetch loop. Windowed widgets show a WindowBadge chip; unwindowed surfaces
say "all history" in their own copy - never a global date-range label.
