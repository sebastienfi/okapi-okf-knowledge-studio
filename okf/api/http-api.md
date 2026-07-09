---
type: API Contract
title: HTTP API
description: The full HTTP surface of the Okapi server - graph, node read/write, lint, report, events, AI, and static assets.
resource: packages/cli/src/server.ts
tags: [api, http, hono]
timestamp: 2026-07-09T00:00:00Z
---

One Hono app serves everything - JSON API, SSE, and the built
[web app](/architecture/web.md) - from a single port.

| Route | Purpose |
|---|---|
| `GET /api/health` | Liveness + version + bundle name. |
| `GET /api/graph` | Nodes, edges, and bundle meta (no bodies). `?includeSystem=false` drops `index.md`/`log.md` nodes and their edges. |
| `GET /api/node?path=` | One node: raw content, parsed frontmatter, neighbors, content hash. |
| `PUT /api/node?path=` | Save an edit - see the [save protocol](/api/save-protocol.md). |
| `GET /api/files/*` | Raw non-md assets referenced by markdown (images etc.). |
| `GET /api/lint` | Conformance summary per file. `?strict=true` adds the strict fields. |
| `GET /api/report` | Bundle health: orphans, broken links, non-conformant files, stale timestamps. |
| `GET /api/events` | The [SSE event stream](/api/sse-events.md). |
| `GET /api/ai/status`, `POST /api/ai/ask` | AI status and ask (opt-in; disabled stubs otherwise). |
| `GET *` | The built SPA, with history fallback. Must stay last. |

# Conventions

* Node identity travels as a `?path=` query parameter (bundle-relative), so
  every read and write funnels through a single path-traversal guard.
* Saves over 10 MiB are rejected (`413`); only `.md` files are editable.
