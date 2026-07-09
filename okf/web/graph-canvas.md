---
type: Web Feature
title: Graph canvas
description: The force-directed document graph - one node per file, colored by type, sized by degree, with hover-neighborhood highlighting.
resource: apps/web/src/features/graph/GraphCanvas.tsx
tags: [web, graph, canvas]
timestamp: 2026-07-09T00:00:00Z
---

The canvas renders the document graph produced by
[graph assembly](/pipeline/graph-assembly.md) with `react-force-graph-2d`:

* **Size = degree.** Hubs are visually bigger; leaves recede.
* **Color = type.** Each free-form `type` value gets a stable color, so the
  bundle's taxonomy is visible at a glance.
* **Hover** highlights a node's direct neighborhood; **click** focuses it and
  opens the [detail panel](/web/detail-panel.md).
* System files (`index.md`, `log.md`) can be hidden to see only concepts.

Node objects are cached across refetches, so when a
[bundle-changed event](/api/sse-events.md) triggers a refetch, the simulation
keeps its layout instead of re-exploding - live edits feel like edits, not
reloads.
