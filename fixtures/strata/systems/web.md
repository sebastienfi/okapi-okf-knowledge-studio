---
type: Service
title: Web dashboard
description: Strata - the React dashboard that turns the metrics into readable insight.
resource: apps/web
tags: [web, dashboard, service]
timestamp: 2026-07-09T00:00:00Z
---

"Strata" (`apps/web`), served by nginx at `:8080` (SPA `try_files` fallback). Stack:
Vite + React + TypeScript, Tailwind v4 (CSS-first) + shadcn/ui, urql (document
cache) + graphql-codegen client-preset, Recharts, d3-force (static layout),
next-themes.

# Surfaces

KPI header, repo switcher, health card ([insights](/analytics/insights.md) grouped
by code), [hotspot](/analytics/file-hotspots.md) scatter,
[activity](/analytics/commit-activity.md) small multiples (zero-filled),
[collaboration](/analytics/collaboration.md) +
[leaderboard](/analytics/top-contributors.md),
[coupling](/analytics/code-coupling.md) force graph,
[ownership](/analytics/directory-ownership.md) treemap,
[branch drift](/analytics/branch-drift.md) widget, commit history explorer, and the
3-tab Add-repository dialog (see the
[add-a-repository playbook](/playbooks/add-repository.md)).

# The how-to-read layer

Data-viz is never self-explanatory: every widget carries a collapsible
*encodes -> Look for -> Act* reading guide with jargon tooltips, an analysis-window
selector (`?win=`, see [analysis window](/analytics/analysis-window.md)), and
honest empty states (small repos legitimately return `[]` for coupling and
collaboration).

# Build and data-flow facts

- Codegen reads the exported `apps/api/schema.graphql` artifact
  (`pnpm --filter api print-schema`), never the running API - hermetic builds.
- urql uses the document cache (analytics rows have no id); `triggerIngestion`
  returns no shared typename, so after an ingest the app explicitly re-queries
  network-only.
- `VITE_API_URL` is inlined at BUILD time (docker build-arg); the browser hits the
  published `localhost:4000`, not the compose-internal hostname.
- `Repository.id` contains slashes - `encodeURIComponent` into the route segment.
- Time series are zero-filled in UTC with Monday weeks to match the server's
  bucketing.
