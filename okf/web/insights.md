---
type: Web Feature
title: Insights
description: Bundle health computed client-side - disconnected groups, orphans, broken links, conformance, stale timestamps.
resource: apps/web/src/features/insights/InsightsPanel.tsx
tags: [web, insights, health]
timestamp: 2026-07-09T00:00:00Z
---

Insights answers "how healthy is this bundle?" instantly, computed in the
browser from the graph payload it already has:

| Insight | Signal |
|---|---|
| Disconnected groups | Union-find over the edges; islands suggest missing cross-links. |
| Orphans | Concepts with degree 0 - written but never referenced. |
| Broken links | Links whose target does not exist; gaps to fill, per [path-is-identity](/decisions/path-is-identity.md). |
| Conformance | Files failing the [spec §9 checks](/pipeline/conformance.md). |
| Stale timestamps | Concepts whose `timestamp` is old or missing. |
| Type distribution | The census of `type` values across the bundle. |

Every finding is clickable and focuses the offending node in the graph, so an
audit turns directly into navigation - and from there into an edit.
