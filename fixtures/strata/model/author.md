---
type: Graph Node
title: Author
description: A commit author, identified globally by email across all repositories.
resource: apps/api/src/schema/type-defs.ts
tags: [graph-model, identity]
timestamp: 2026-07-09T00:00:00Z
---

# Schema

| Property | Type | Notes |
|---|---|---|
| `id` | ID! | = email; **global across repos, by design** ([identity](/model/identity.md)) |
| `email` | String! | natural key, kept as a filterable property |
| `name` | String! | display name from this author's MOST RECENT commit (ingestion invariant 7: the `SET` is guarded by a `lastSeenAt` comparison, because git log order is newest-first and a naive last-write-wins keeps the OLDEST name) |

# Why global

"What has this person touched anywhere?" is a feature an engineering manager wants,
and it matches Git's own identity model. Per-repo scoping is just a traversal via
[CONTRIBUTES_TO](/model/contributes-to.md).

# Relationships

- `-[:AUTHORED]->` [Commit](/model/commit.md) ([AUTHORED](/model/authored.md))
- `-[:CONTRIBUTES_TO]->` [Repository](/model/repository.md)

# Known identity noise (documented, deferred)

- GitHub noreply addresses split one human into several authors.
- Shared emails merge several humans into one author.
- Mailmap resolution is a v2 feature; committer identity and `Co-authored-by`
  trailers are deliberately cut (author-only model).
