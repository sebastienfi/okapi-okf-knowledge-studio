---
type: Overview
title: Strata - Git Repository Analytics Engine
description: What this bundle covers and how the pieces of the analytics engine fit together.
resource: README.md
tags: [strata, architecture]
timestamp: 2026-07-09T00:00:00Z
---

Strata ingests local Git repositories into **Neo4j** and surfaces
engineering-management insight through a **GraphQL API** and a **web dashboard**.
One command (`docker compose up --build`) brings up the full stack: Neo4j (`:7474`),
the API (`:4000/graphql`), the dashboard (`:8080`).

# How the pieces fit

| Layer | Concepts |
|---|---|
| Graph model | [Node identity scheme](/model/identity.md) + the node/relationship concepts under [model](/model/index.md) |
| Write path | [Ingestion service](/systems/ingestion-service.md), honoring the [ingestion contract](/contracts/ingestion-contract.md) |
| Read path | [GraphQL API](/contracts/graphql-api.md) served by the [API server](/systems/api.md) on [Neo4j](/systems/neo4j.md) |
| Metrics | Eight repo-scoped analytics under [analytics](/analytics/index.md) |
| Interpretation | [Insights](/analytics/insights.md) - server-side thresholds + suggested actions |
| Faces | [Web dashboard](/systems/web.md) and the [/strata skill](/systems/strata-skill.md) |

# Core graph shape

```
(Author)-[:AUTHORED]->(Commit)-[:MODIFIED {additions,deletions}]->(File)
(Commit)-[:PARENT {order}]->(Commit)          # DAG: 0 parents = root, 2+ = merge
(Repository)-[:HAS_COMMIT|HAS_FILE|HAS_BRANCH]->(Commit|File|Branch)
(Author)-[:CONTRIBUTES_TO]->(Repository)      # materialized at ingest
(Branch)-[:POINTS_TO]->(Commit)               # refs are pointers to tips
```

The authoritative design document is `docs/graphql-schema.md` in this repository; the
SDL there is **both** the API contract and the Neo4j schema (`@neo4j/graphql` compiles
it to Cypher). This bundle distills that document plus the implementation into
navigable concepts.
