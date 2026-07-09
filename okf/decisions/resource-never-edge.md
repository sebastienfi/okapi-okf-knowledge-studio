---
type: Design Decision
title: "`resource:` is never an edge"
description: The resource field is provenance for humans; only markdown links assert relationships.
resource: packages/core/src/graph.ts
tags: [decision, frontmatter, provenance]
timestamp: 2026-07-09T00:00:00Z
---

Every concept in this bundle carries a `resource:` frontmatter field pointing
at the source file or document it describes - like this file's
`packages/core/src/graph.ts`. [Graph assembly](/pipeline/graph-assembly.md)
displays that value in the detail panel but **never** turns it into an edge.

# Why

* **Resources point outside the bundle's namespace.** Source files, consoles,
  and URLs are not concepts; edging to them would create nodes that cannot be
  opened, linted, or edited.
* **The relationship kinds differ.** A markdown link asserts *this knowledge
  relates to that knowledge*. A resource asserts *this knowledge describes
  that artifact* - provenance, not cross-reference. Collapsing the two would
  make the graph unreadable as either.
* **The OKF spec draws the same line.** Consumers treat `resource` as an
  opaque locator; only body links participate in link resolution.

If a concept genuinely relates to another *concept*, write a markdown link in
the body - that is the assertion the graph renders.
