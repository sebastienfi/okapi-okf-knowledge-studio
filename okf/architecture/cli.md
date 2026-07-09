---
type: Package
title: okapi-okf CLI
description: The published npm package - a Hono server holding the parsed bundle in memory, plus the `okapi` and `okapi lint` commands.
resource: packages/cli/src/cli.ts
tags: [package, cli, server]
timestamp: 2026-07-09T00:00:00Z
---

The CLI is what users install (`npm i -g okapi-okf`, Homebrew, or a prebuilt
binary). It parses the bundle with [@okapi/core](/architecture/core.md), serves
the [HTTP API](/api/http-api.md) and the built web app from one port, watches
the bundle for changes, and opens the browser.

# Commands

| Command | Does |
|---|---|
| `okapi [bundle]` | Parse and serve (default bundle: `.`). Auto-increments the port if taken. |
| `okapi lint [bundle]` | OKF conformance check; see [lint a bundle](/playbooks/lint-a-bundle.md). |

Flags: `--port`, `--host`, `--no-open`, `--no-watch`, `--ai`, `--provider`.

# Responsibilities

* **Serve.** One Hono app: JSON API + static SPA + fallback. See the
  [endpoint table](/api/http-api.md).
* **Save safely.** Edits go through the hash-guarded
  [save protocol](/api/save-protocol.md) - atomic writes, path traversal
  guards, 409 on conflict.
* **Watch.** `chokidar` watches the bundle and pushes
  [SSE events](/api/sse-events.md) so open tabs live-reload.
* **AI (opt-in).** `--ai` registers the ask routes when an API key is present;
  otherwise they report disabled.
