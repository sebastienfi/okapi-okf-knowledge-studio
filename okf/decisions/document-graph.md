---
type: Design Decision
title: Document graph, not knowledge graph
description: Okapi renders files and the links between them; it does not guess at semantic entities inside bodies.
resource: docs/ARCHITECTURE.md
tags: [decision, graph]
timestamp: 2026-07-09T00:00:00Z
---

A bundle's markdown bodies may *describe* a rich knowledge graph - schemas,
entities, query snippets. Okapi deliberately does not try to render that.
What [graph assembly](/pipeline/graph-assembly.md) builds, and what the
[graph canvas](/web/graph-canvas.md) shows, is the **document graph**: one
node per `.md` file, one edge per markdown link between files.

# Why

* **It is the graph the author actually maintains.** Links are explicit,
  verifiable assertions; entities extracted from prose would be guesses.
* **It keeps content and structure separate.** A Cypher diagram or an example
  snippet inside a body is content about some other system - promoting it to
  edges would conflate the map with the territory.
* **It matches OKF's own semantics.** The spec says a link asserts a
  relationship whose meaning lives in the surrounding prose; the file is the
  unit of knowledge.

The practical consequence: navigating the graph is exactly navigating the
bundle's files, and every insight (orphans, groups, broken links) is directly
actionable as an edit to a file.
