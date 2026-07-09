---
type: Pipeline Stage
title: Graph assembly
description: Build nodes and deduped weighted edges, compute degrees, and derive the bundle metadata.
resource: packages/core/src/graph.ts
tags: [pipeline, parser, graph]
timestamp: 2026-07-09T00:00:00Z
---

The final data-building stage assembles everything into one `GraphResponse`:

* **Nodes** - one per `.md` file. Each carries its `type` (drives color in the
  UI), `degree` (drives size), frontmatter fields, conformance verdict, broken
  links, and any unknown frontmatter keys preserved verbatim in `extra`.
  `index.md` / `log.md` are flagged as system nodes.
* **Edges** - one per (source, target) pair. Duplicate links between the same
  two files collapse into a single edge with a `weight` count.
* **Meta** - node/concept/system/edge/broken-link counts, the census of `type`
  values, the bundle's `okf_version`, and `bundleName` (the basename of the
  bundle directory).

Two things deliberately never become edges: the `resource:` frontmatter field
(see [resource-never-edge](/decisions/resource-never-edge.md)) and anything
inside code fences (guaranteed upstream by
[link extraction](/pipeline/link-extraction.md)).

Every node then receives its per-file verdict in
[conformance](/pipeline/conformance.md).
