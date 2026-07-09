---
type: Web Feature
title: Detail panel
description: Rendered markdown with frontmatter meta and neighbor navigation; internal links move through the graph instead of loading pages.
resource: apps/web/src/features/detail/DetailPanel.tsx
tags: [web, detail, markdown]
timestamp: 2026-07-09T00:00:00Z
---

Selecting a node opens its full document: a meta card with the frontmatter
fields (`type`, `description`, `resource`, `tags`, `timestamp`, plus any extra
keys), the body rendered with `react-markdown` and `rehype-highlight` (GFM
tables, task lists, syntax-highlighted fences), and the node's in/out
neighbors.

The key interaction: an internal `.md` link inside the rendered markdown does
**not** navigate the browser - it selects the target node, so reading flows
through the [graph canvas](/web/graph-canvas.md) as a series of focus moves.
External links open normally in a new tab.

From here the [editor](/web/editor.md) opens the same file for in-place
editing.
