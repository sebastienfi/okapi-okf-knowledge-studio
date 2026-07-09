---
type: Package
title: Web app
description: The React + Vite SPA - graph canvas, detail panel, editor, insights, and Ask. Built assets ship inside the CLI package.
resource: apps/web/src/App.tsx
tags: [package, frontend, react]
timestamp: 2026-07-09T00:00:00Z
---

The frontend is a single-page app built with Vite; `pnpm build` emits it into
the CLI package's `dist/public`, so the published `okapi-okf` package serves it
with zero extra dependencies. In dev it runs under Vite with HMR, proxying
`/api` to the dev API server.

# Features

| Feature | Does |
|---|---|
| [Graph canvas](/web/graph-canvas.md) | Force-directed document graph, colored by type, sized by degree. |
| [Detail panel](/web/detail-panel.md) | Rendered markdown + frontmatter meta + neighbor navigation. |
| [Editor](/web/editor.md) | In-place markdown editing with conflict-safe saves. |
| [Insights](/web/insights.md) | Bundle health: orphans, broken links, groups, conformance. |
| [Ask](/web/ask-ai.md) | Opt-in AI answers grounded in the bundle, with citations. |

# State model

Three stores, each for what it is best at: TanStack Query caches everything
fetched from the [HTTP API](/api/http-api.md), Zustand holds ephemeral UI state
(selection, filters, panel layout), and the URL hash carries the deep-linkable
selection. Theme tokens are CSS variables, so light/dark is pure CSS.
