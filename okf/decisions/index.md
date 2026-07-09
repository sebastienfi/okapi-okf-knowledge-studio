# Design Decision

* [Document graph, not knowledge graph](document-graph.md) - Okapi renders files and the links between them; it does not guess at semantic entities inside bodies.
* [Links come from the AST](ast-based-links.md) - Edges are extracted from real markdown link nodes, so code fences can never leak edges - by construction, not by filtering.
* [`resource:` is never an edge](resource-never-edge.md) - The resource field is provenance for humans; only markdown links assert relationships.
* [The path is the identity](path-is-identity.md) - A concept's id is its file path; renames are identity changes, and broken links are gaps rather than errors.
