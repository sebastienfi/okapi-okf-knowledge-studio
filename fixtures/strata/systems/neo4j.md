---
type: Database
title: Neo4j
description: The graph store - image, plugins, auth, and what must be bootstrapped.
resource: docker-compose.yml
tags: [neo4j, infrastructure]
timestamp: 2026-07-09T00:00:00Z
---

Single `neo4j:5-community` container; browser at `:7474`, bolt at `:7687`; auth
`neo4j` / `password` (Neo4j 5 requires >= 8 characters).

# Deployment requirements

- **APOC Core is mandatory**: `NEO4J_PLUGINS='["apoc"]'` in docker-compose.
  `@neo4j/graphql` v7 projects DateTime fields via `apoc.date.convertFormat`; any
  query selecting a DateTime field throws without it.
- **Constraints come from the bootstrap, not the SDL**: the
  [ingestion contract](/contracts/ingestion-contract.md)'s
  `CREATE CONSTRAINT/INDEX IF NOT EXISTS` block runs at
  [API server](/systems/api.md) startup. Without it, ingestion MERGEs degrade to
  label scans.
- Target repositories are volume-mounted at `/repos` (host `./target_repos/` +
  a bind-mount of this repo itself for the zero-setup self-ingest).

# Driver notes

`neo4j-driver` pinned `^6.2.0`. JS number parameters store as Cypher **Float**;
every `Int!` write site wraps with `toInteger()` in Cypher.

# Inspection

A Neo4j MCP server (`uvx neo4j-mcp-server`) is wired for live schema inspection and
verification queries; credentials must match the compose file.
