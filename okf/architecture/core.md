---
type: Package
title: "@okapi/core"
description: The pure OKF parser - walks a bundle, parses frontmatter and links, and assembles the document graph. No HTTP, no side effects.
resource: packages/core/src/index.ts
tags: [package, parser, core]
timestamp: 2026-07-09T00:00:00Z
---

`@okapi/core` is the single source of truth: the graph API, `okapi lint`, and
the Insights panel all read from it. It is a workspace-private package, inlined
into the CLI bundle at build time by `tsup`, so `npx okapi-okf` needs no
install-time compilation.

# The pipeline

Parsing is a fixed sequence of [six stages](/pipeline/index.md):

| Stage | Does |
|---|---|
| [Walk](/pipeline/walk.md) | Enumerate every `.md` under the bundle root. |
| [Frontmatter](/pipeline/frontmatter.md) | Split and YAML-parse the frontmatter block; tolerate absence. |
| [Link extraction](/pipeline/link-extraction.md) | Markdown-AST walk; only real link nodes count. |
| [Resolution](/pipeline/resolve.md) | Turn hrefs into in-bundle targets; record broken links. |
| [Graph assembly](/pipeline/graph-assembly.md) | Nodes, deduped weighted edges, degrees, bundle meta. |
| [Conformance](/pipeline/conformance.md) | The OKF spec §9 verdict per file. |

# Design constraints

* **Pure.** `buildGraph(root)` reads the filesystem and returns data. No
  server state, no caching, no network.
* **Never crashes on bad input.** Malformed frontmatter becomes a recorded
  parse error on the node; a missing link target becomes a broken-link entry,
  per [path-is-identity](/decisions/path-is-identity.md).
* **Faithful to the reference validator.** Link resolution and conformance
  mirror the OKF reference tooling, so `okapi lint` and `validate_okf.py`
  agree on the same bundle.
