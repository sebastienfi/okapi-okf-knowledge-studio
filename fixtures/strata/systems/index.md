# Database

* [Neo4j](neo4j.md) - The graph store: image, plugins, auth, and what must be bootstrapped.

# Service

* [API server](api.md) - GraphQL Yoga + @neo4j/graphql v7: the read path and schema owner.
* [Ingestion service](ingestion-service.md) - The single writer: simple-git parsing into batched UNWIND Cypher.
* [Web dashboard](web.md) - "Strata": the React dashboard that turns the metrics into readable insight.

# Tool

* [/strata skill](strata-skill.md) - The terminal/AI-agent face: sync, ingest, and analyze any repo from its own Claude Code session.
