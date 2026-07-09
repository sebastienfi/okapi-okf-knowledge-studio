---
type: Metric
title: Collaboration
description: Author pairs who touched the same files.
resource: apps/api/src/schema/type-defs.ts
tags: [analytics, collaboration]
timestamp: 2026-07-09T00:00:00Z
---

`Repository.collaboration(limit: 20, since, until)` - a `@cypher` field on
[Repository](/model/repository.md).

# Schema (per pair)

`authorAEmail/Name`, `authorBEmail/Name`, `sharedFileCount` (distinct files both
touched in the window).

# Semantics

- Anchors via `HAS_FILE` (see [membership edges](/model/membership-edges.md),
  invariant 3), then walks
  `(File)<-[:MODIFIED]-(Commit)<-[:AUTHORED]-(Author)`.
- Pairs deduped by `a1.email < a2.email`.
- Files with more than 100 distinct authors are excluded: no collaboration signal,
  quadratic pair-expansion cost.
- Windowed by the [analysis window](/analytics/analysis-window.md).
- Single-author repos return `[]` - honest empty state.

A same-week refinement (pairs active on the file in the same week) is a documented
next step, not shipped.

# Consumers

Collaboration widget + contributor leaderboard tab in the
[dashboard](/systems/web.md).
