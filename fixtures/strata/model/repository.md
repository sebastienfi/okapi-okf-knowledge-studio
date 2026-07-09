---
type: Graph Node
title: Repository
description: One ingested Git repository; the anchor node every analytic scopes to.
resource: apps/api/src/schema/type-defs.ts
tags: [graph-model]
timestamp: 2026-07-09T00:00:00Z
---

# Schema

| Property | Type | Notes |
|---|---|---|
| `id` | ID! | canonical container path (e.g. `/repos/my-repo`) - natural key and MERGE target; see [identity](/model/identity.md) |
| `name` | String! | basename of the path, for display |
| `path` | String! | same value as `id`, kept as an explicit filterable property |
| `ingestedAt` | DateTime! | written at ingest start, refreshed on completion (never property-less) |

# Relationships

- `-[:HAS_COMMIT]->` [Commit](/model/commit.md), `-[:HAS_FILE]->` [File](/model/file.md),
  `-[:HAS_BRANCH]->` [Branch](/model/branch.md) - see [membership edges](/model/membership-edges.md)
- `<-[:CONTRIBUTES_TO]-` [Author](/model/author.md) - materialized at ingest
  ([edge concept](/model/contributes-to.md))

# Role in analytics

All repo analytics are GraphQL `@cypher` fields ON this node (`fileHotspots`,
`fileCoupling`, `commitActivity`, `collaboration`, `topContributors`,
`directoryOwnership`) plus the code-resolved [insights](/analytics/insights.md)
field. Inside each statement `this` is the repo node, so multi-repo scoping is free
and un-forgettable; a dashboard fetches repo metadata plus every widget in one
request. See [analytics](/analytics/index.md).
