---
type: Pipeline Stage
title: Resolution
description: Turn each href into a bundle-relative `.md` target or reject it; missing targets are recorded as broken links.
resource: packages/core/src/resolve.ts
tags: [pipeline, parser, links]
timestamp: 2026-07-09T00:00:00Z
---

Each extracted href is resolved with the same rules as the OKF reference
validator:

* External schemes (`http:`, `https:`, `mailto:`), protocol-relative (`//`)
  and pure-anchor (`#section`) links are skipped - they are not bundle links.
* `#fragment` suffixes are stripped before resolving, so `/a.md` and
  `/a.md#schema` collapse onto the same target.
* A leading `/` resolves from the **bundle root**; anything else resolves from
  the linking file's directory.
* Targets escaping the bundle (`../outside.md`) are rejected.
* Only `.md` targets become candidate edges; images and other assets are
  content, not relationships.

A candidate whose target exists becomes an edge in
[graph assembly](/pipeline/graph-assembly.md). A candidate whose target does
not exist is recorded as a **broken link on the source node** - never a
dangling edge, never an error. That permissiveness is deliberate: see
[path-is-identity](/decisions/path-is-identity.md).
