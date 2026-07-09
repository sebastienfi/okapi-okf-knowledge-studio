---
type: API
title: GraphQL API
description: The read-only API surface - generated queries, analytics fields, and the ops mutations.
resource: apps/api/src/schema/type-defs.ts
tags: [graphql, api, contract]
timestamp: 2026-07-09T00:00:00Z
---

Endpoint: `http://localhost:4000/graphql` (GraphiQL enabled, permissive CORS). The
SDL is BOTH the API contract and the Neo4j schema; served by the
[API server](/systems/api.md).

# Read-only by construction

`extend schema @mutation(operations: [])` disables ALL generated
create/update/delete mutations (verified: only the ops mutations below remain).
Single writer: the [ingestion service](/systems/ingestion-service.md).

# Generated read surface (zero custom code)

`repositories`, `commits`, `files`, `authors`, `branches` with v7 filters, sorting,
pagination, nested traversal in both directions, and connections exposing edge
properties (`filesConnection { edges { properties { additions deletions } } }`,
`parentsConnection` for [PARENT](/model/parent.md).order) and `totalCount`.

# Analytics surface

Seven `@cypher`/`@customResolver` fields on [Repository](/model/repository.md) - see
[analytics](/analytics/index.md) - plus `File.coupledFiles`. One request fetches repo
metadata and every widget.

# Ops surface (code-resolved, merged via `Neo4jGraphQL({ resolvers })`)

| Operation | Contract |
|---|---|
| `triggerIngestion(repoPath): IngestionResult!` | synchronous; counts + durationMs + the new repo id; REJECTS a run while one is RUNNING; failures are GraphQL errors |
| `ingestionStatus: IngestionStatus!` | in-memory `IDLE / CLONING / RUNNING / FAILED`; poll while a run is in flight |
| `mountedRepositories: [MountedRepository!]!` | scans the `/repos` mount; classifies indexed/new; `commitCount > indexedCommitCount` = stale ("+N new"). The on-disk count uses the ingester's exact ref set (`--branches --remotes --tags`) - two dependents (web staleness badge, /strata freshness check) break if that changes |
| `cloneRepository(url): CloneResult!` | public GitHub HTTPS only (pinned by regex, no option injection); two-phase: clone (status CLONING, same writer lock), then the client calls `triggerIngestion` |

# Client gotchas

- `@limit` clamps NESTED connections too (File 100, Author 50, Commit 50 defaults) -
  pass `first`/`limit` explicitly; use the denormalized
  [Commit](/model/commit.md) totals rather than summing capped edges.
- `Commit.author` / `Commit.repository` are LIST fields (v7 requirement) - take `[0]`.
- DateTime analytic args are ISO strings server-side; see the
  [analysis window](/analytics/analysis-window.md).
- Yoga returns GraphQL errors as HTTP 200 + `{"errors": [...]}` - `curl --fail`
  alone can never catch them.
- For codegen: `pnpm --filter api print-schema` emits the library-augmented
  `apps/api/schema.graphql` offline; the web build reads that artifact, never the
  running API.
