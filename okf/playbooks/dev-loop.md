---
type: Playbook
title: Dev loop
description: Run Okapi against this very bundle with hot reload, swap in another bundle, and the checks to run before pushing.
resource: CONTRIBUTING.md
tags: [playbook, development]
timestamp: 2026-07-09T00:00:00Z
---

# Hot-reload development

```bash
pnpm dev
```

Two processes: the Vite dev server (`http://localhost:5173`, HMR for the
[web app](/architecture/web.md)) and the API server (port 4317) serving **this
bundle** - the documentation you are reading is the default dev fixture. Vite
proxies `/api`, and file edits reach the browser live over
[SSE](/api/sse-events.md).

Point the dev API at another bundle:

```bash
OKAPI_BUNDLE=./path/to/bundle pnpm dev
```

# Run the real CLI

```bash
pnpm build
node packages/cli/dist/cli.js ./path/to/bundle
```

Behaves exactly like `npx okapi-okf`. Useful flags: `--no-open`, `--no-watch`,
`--port <n>`.

# Before you push

```bash
pnpm lint && pnpm typecheck && pnpm test && pnpm build
```

All four run in CI on Node 22 and 24, across Ubuntu and Windows. Note that the
integration tests assert against this bundle - if you rename or unlink one of
its load-bearing files, the tests will tell you.
