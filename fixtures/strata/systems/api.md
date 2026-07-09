---
type: Service
title: API server
description: GraphQL Yoga + @neo4j/graphql v7 - the read path and schema owner.
resource: apps/api/src/index.ts
tags: [api, graphql, service]
timestamp: 2026-07-09T00:00:00Z
---

Node + TypeScript (`apps/api`), serving the [GraphQL API](/contracts/graphql-api.md)
at `:4000/graphql`. Stack: GraphQL Yoga + `@neo4j/graphql` **7.5.4** +
`neo4j-driver ^6.2` + `simple-git`.

# Architecture

Pragmatic Clean, feature-based; two domains only:

- **Schema** - the SDL in `apps/api/src/schema/type-defs.ts` (transcribed from
  `docs/graphql-schema.md` section 3, the frozen contract; do not edit one without
  the other). `@neo4j/graphql` compiles it to Cypher and IS the data + service layer
  for queries - there are deliberately NO DTO/entity/repository layers.
- **Ingestion** - the [ingestion service](/systems/ingestion-service.md), the only
  writer, merged in via `Neo4jGraphQL({ resolvers })`.

The three analytic Cypher bodies reused by [insights](/analytics/insights.md) are
hoisted to `apps/api/src/schema/insights/analytics-queries.ts` and interpolated into
the SDL - one source of truth for widgets and interpretation.

# Startup

Runs the constraint bootstrap from the
[ingestion contract](/contracts/ingestion-contract.md) before serving.

# Known v7 sharp edges (live-verified; full list in `ai_docs/neo4j__graphql/v7-gotchas.md`)

- `@sortable(byValue:)`, not `enabled:`.
- DateTime `@cypher`/`@customResolver` args arrive as ISO strings - wrap with
  `datetime($arg)` ([analysis window](/analytics/analysis-window.md)).
- An aggregating `WITH` drops `this` - carry it through.
- `datetime.truncate` fragments buckets across TZ offsets - normalize to UTC first.
- `@node` types nested inside `@cypher`-fed plain types do not resolve - analytics
  rows keep scalar `fileId`s.
- Raw negative `LIMIT` is a runtime error - every field clamps.

# Container notes

The image needs `apk add git` (simple-git shells out) and
`git config --global --add safe.directory '*'` (bind-mounted repos are
foreign-owned; "dubious ownership" is fatal otherwise). Repo maintainers widen
`buildResolvers(...)` at BOTH call sites (`index.ts` and `print-schema.ts`) when
adding resolvers, or the offline schema export breaks.
