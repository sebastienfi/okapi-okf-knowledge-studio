---
type: API Contract
title: Save protocol
description: Hash-guarded, path-guarded, atomic saves - how an in-browser edit becomes bytes on disk without clobbering anyone.
resource: packages/cli/src/save.ts
tags: [api, save, concurrency]
timestamp: 2026-07-09T00:00:00Z
---

The [editor](/web/editor.md) never blind-writes. A save is a small optimistic
concurrency protocol over the [HTTP API](/api/http-api.md):

1. `GET /api/node?path=` returns the raw content **and its SHA-256 hash**.
2. The client sends `PUT /api/node?path=` with `{ content, baseHash }`.
3. The server re-hashes the file as it exists on disk *now*. If it no longer
   matches `baseHash`, the save is refused with `409` and the current disk
   content, so the client can merge instead of clobbering a concurrent edit.

# Path safety

Every read and write resolves the client-supplied path through a single choke
point that decodes, normalizes, and rejects null bytes, absolute paths, and
`..` escapes - the resolved path must sit inside the bundle root. As
defense-in-depth against symlink tricks, the target's parent directory is
`realpath`-checked against the bundle root before writing.

# Atomicity

Content is written to a temp file in the same directory, `fsync`ed, then
renamed over the original (preserving its mode). A crash mid-save leaves the
original intact; watchers only ever see complete files.

After a successful save the bundle graph is rebuilt and a `bundle-changed`
event goes out over [SSE](/api/sse-events.md).
