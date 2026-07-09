---
type: Design Decision
title: Links come from the AST
description: Edges are extracted from real markdown link nodes, so code fences can never leak edges - by construction, not by filtering.
resource: packages/core/src/links.ts
tags: [decision, parser, links]
timestamp: 2026-07-09T00:00:00Z
---

A regex over raw markdown would happily find "links" inside code blocks. Okapi
instead parses each body to a markdown AST and lets only `link` and
`definition` nodes produce edges - the approach implemented in
[link extraction](/pipeline/link-extraction.md).

Anything fenced is a `code` node, which is not a link. This very file proves
it: the following block contains what looks exactly like a bundle link, yet
this document has no edge and no broken link pointing at that target.

```markdown
[not an edge](/model/widget.md)
```

# Why it matters

Bundles that document code are *full* of examples - shell sessions, Cypher,
GraphQL, and markdown-about-markdown like the fence above. If extraction were
textual, every example would pollute the graph with phantom edges and phantom
broken links, and the Insights panel would cry wolf. AST-based extraction
makes "code is content, links are structure" a structural guarantee rather
than a filter to maintain.
