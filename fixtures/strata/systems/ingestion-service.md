---
type: Service
title: Ingestion service
description: The single writer - simple-git parsing into batched UNWIND Cypher.
resource: apps/api/src/ingestion/git-ingestion-service.ts
tags: [ingestion, service, git]
timestamp: 2026-07-09T00:00:00Z
---

`GitIngestionService` (`apps/api/src/ingestion/`) reads a repo with `simple-git` and
writes to [Neo4j](/systems/neo4j.md) in batched Cypher `UNWIND` transactions - the
bottleneck is round-trips, not parsing. It implements every invariant of the
[ingestion contract](/contracts/ingestion-contract.md). A Rust/`git2` parser is a
documented future optimization, not POC scope.

# Parsing-critical git invocation (`ingestion/git-log.ts`)

- `%s` subject only (a `%B` body could contain numstat-shaped lines).
- NUL-separated header fields + `%x1e` record separator.
- `--all` (branch tips must exist as [Commit](/model/commit.md) nodes for
  [POINTS_TO](/model/points-to.md)); `--no-renames`; `--numstat`.
- `-c core.quotePath=false` on BOTH `git log` and `ls-tree`, or non-ASCII paths
  store C-quoted garbage; the parser still unquotes residual escapes.
- `existsAtHead` is `ON CREATE = false` in the file pass, so history-only files are
  never null in a non-null field.

# Write discipline

- Single-writer lock shared by `triggerIngestion` and `cloneRepository`
  (concurrent runs rejected; status exposed via `ingestionStatus`).
- Every `Int!` write wraps `toInteger()` (JS numbers store as Float otherwise).
- Clone is two-phase and guarded: `cloneRepository` only clones (status CLONING);
  the client then ingests. URL pinned to public GitHub HTTPS by regex; simple-git's
  `.env()` REPLACES the environment, so `process.env` is spread back in with
  `GIT_TERMINAL_PROMPT=0`; never `--depth`.

# Repo discovery (`ingestion/repo-discovery-service.ts`)

Backs `mountedRepositories`: `fs.readdir` on the `/repos` mount + ONE graph read
(raw driver) + per-repo `git rev-list --count --branches --remotes --tags` (MUST
match the ingester's ref set or the staleness badge is noise) + `du -sk`. A missing
`/repos` (host dev) returns `[]`, not an error.
