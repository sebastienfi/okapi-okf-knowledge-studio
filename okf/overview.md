---
type: Overview
title: Okapi - an OKF Knowledge Studio
description: What Okapi is, the three packages it is built from, and how a bundle flows from disk to an interactive graph.
resource: README.md
tags: [overview, architecture]
timestamp: 2026-07-09T00:00:00Z
---

Okapi turns any [Open Knowledge Format](https://github.com/GoogleCloudPlatform/knowledge-catalog/blob/main/okf/SPEC.md)
bundle - a directory of markdown files with YAML frontmatter, cross-linked by
plain markdown links - into an interactive studio: a force-directed graph, a
rich detail panel, in-browser editing, bundle health insights, OKF conformance
linting, and an opt-in "Ask the bundle" AI. One command, no build step:

```bash
npx okapi-okf ./path/to/bundle
```

# The three packages

| Package | Role |
|---|---|
| [@okapi/core](/architecture/core.md) | Pure parser: bundle directory in, document graph out. No HTTP, no side effects. |
| [okapi-okf CLI](/architecture/cli.md) | Hono API server + the `okapi` command. What npm installs. |
| [Web app](/architecture/web.md) | React + Vite SPA, served by the CLI as static assets. |

# From disk to graph

A bundle is parsed by the [six-stage pipeline](/pipeline/index.md): walk,
frontmatter, link extraction, resolution, graph assembly, conformance. What the
studio renders is the *document* graph - one node per `.md` file, one edge per
markdown link - a deliberate choice explained in
[the document-graph decision](/decisions/document-graph.md).

# This bundle

This very bundle documents Okapi itself, and it is the default bundle `pnpm dev`
serves: the studio dogfoods its own documentation. Some of its files are
load-bearing for the integration tests - see the comments at the top of the
test files before renaming anything.
