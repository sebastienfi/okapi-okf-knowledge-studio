---
type: API Contract
title: SSE events
description: The `/api/events` stream - how file watching reaches open tabs, and how a tab ignores the echo of its own save.
resource: packages/cli/src/sse.ts
tags: [api, sse, watch]
timestamp: 2026-07-09T00:00:00Z
---

`GET /api/events` on the [HTTP API](/api/http-api.md) is a Server-Sent Events
stream. `chokidar` watches the bundle directory; every change funnels through
an in-process event hub to all connected clients.

| Event | Payload | Meaning |
|---|---|---|
| `ready` | `{}` | Stream established. |
| `ping` | `{}` | Heartbeat every 15 s of silence; keeps proxies from closing the stream. |
| `bundle-changed` | `{ change, path?, originId? }` | The bundle was modified; refetch. |

`change` is one of `added`, `updated`, `removed`, or `rebuilt` (a bulk change,
e.g. many files at once).

# Echo suppression

Two feedback loops are cut deliberately:

* **Watcher side** - a save made through the API marks its path as a
  self-write, so the file watcher does not fire a second, redundant
  `bundle-changed` for the write it just caused.
* **Client side** - the saving tab sends an `x-okapi-client` id, which comes
  back as `originId` on the event; the originating tab (which already has the
  fresh content) ignores its own echo, while other tabs - and the
  [graph canvas](/web/graph-canvas.md) - refetch.
