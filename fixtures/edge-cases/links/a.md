---
type: Thing
title: A
---

Absolute [b](/b.md), fragment [b again](/b.md#section), relative [c](./sub/c.md).
External [site](https://example.com) and [mail](mailto:x@y.com).
Broken [missing](/does-not-exist.md) and image [pic](/pic.png).
Escape [out](/../outside.md).

Inline code `[fake](/nope.md)` must not become an edge.

```cypher
MATCH (a)-[:REL]->(b) RETURN a, [x](/also-not-an-edge.md)
```
