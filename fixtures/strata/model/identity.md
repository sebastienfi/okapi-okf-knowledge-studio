---
type: Design Decision
title: Node identity scheme
description: How every node gets a unique id in a multi-repo database, and why authors are global.
resource: docs/graphql-schema.md
tags: [identity, multi-repo, graph-model]
timestamp: 2026-07-09T00:00:00Z
---

None of Git's natural keys are globally unique across repositories: every repo has a
`README.md`, branch names always collide, and commit hashes collide across clones and
forks of the same project. Every node therefore carries a uniform synthetic `id`,
built by ONE ingestion helper and never parsed back.

# Schema

| Node | id | Scope |
|---|---|---|
| [Repository](/model/repository.md) | canonical container path, e.g. `/repos/my-repo` | global (the path IS the identity) |
| [Commit](/model/commit.md) | `<repoId>:<hash>` | repo-scoped |
| [File](/model/file.md) | `<repoId>:<path>` | repo-scoped |
| [Branch](/model/branch.md) | `<repoId>:<name>` | repo-scoped |
| [Author](/model/author.md) | email | **global, by design** |

Natural keys (`hash`, `path`, `name`, `email`) remain plain, filterable properties.

# Consequences

- Repo-scoped analytics are correct **by construction**: a File's
  [MODIFIED](/model/modified.md) edges can only come from its own repo's commits.
- The uniform `id` gives GraphQL clients a cache-normalization key for free, and
  ingestion a single `MERGE (n:Label {id: ...})` pattern.
- Re-mounting a repo at a different path creates a NEW Repository and orphans the old
  subgraph. Repair: delete, then re-ingest.
- Commit hashes shared across ingested forks are deliberately NOT deduped: a shared
  commit's MODIFIED edges would leak analytics across repos (rejected alternative).
- A minted UUID and root-commit-hash identity were also rejected (idempotent re-ingest
  still needs a path lookup; forks share root commits).
- Unique constraints do NOT come from the GraphQL schema library (`@id` creates
  nothing in v7); the bootstrap block in the
  [ingestion contract](/contracts/ingestion-contract.md) creates them.
