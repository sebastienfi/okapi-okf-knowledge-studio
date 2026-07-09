---
type: Contract
title: Ingestion contract
description: The nine invariants and the constraint bootstrap every analytic depends on.
resource: docs/graphql-schema.md
tags: [ingestion, invariants, contract]
timestamp: 2026-07-09T00:00:00Z
---

The `@cypher` analytics are only correct if the
[ingestion service](/systems/ingestion-service.md) guarantees these invariants
(authoritative text: `docs/graphql-schema.md` section 5).

# The invariants

1. **Exactly one [AUTHORED](/model/authored.md) edge per commit**, written in the
   same transaction as the commit. Missing = commit silently drops from every
   analytic; duplicate = silent double-count.
2. **Two-pass commits**: all [Commit](/model/commit.md) nodes + properties first,
   [PARENT](/model/parent.md) edges second via `MATCH` on both endpoints - never
   placeholder nodes; shallow-clone unknown parents skipped.
3. **[Membership edges](/model/membership-edges.md) written in the same batch as the
   node** - [collaboration](/analytics/collaboration.md) anchors via `HAS_FILE` and
   desyncs otherwise.
4. **[Repository](/model/repository.md) MERGEd first with `ingestedAt` = run start**
   (never property-less), refreshed on completion.
5. **Re-ingest reset phase** (plain MERGE is not idempotent for things that MOVED):
   branches are `DETACH DELETE`d and rebuilt from refs;
   [File](/model/file.md).existsAtHead is reset to `false` then set from
   `git ls-tree`. Force-pushed/orphaned commits are a documented limitation:
   delete-then-reingest.
6. **`git log --numstat --no-renames`**: rename = delete + add; binary `-` becomes a
   null [MODIFIED](/model/modified.md) property and 0 in denormalized sums; merges
   have no numstat rows, so `additions/deletions/filesChanged = 0`.
7. **[Author](/model/author.md).name = the name on that author's most recent
   commit** (`lastSeenAt`-guarded SET; git log is newest-first, so naive
   last-write-wins keeps the oldest name).
8. **Branches** = local + remote-tracking refs, `origin/` stripped and deduped;
   detached HEAD skipped.
9. **[Branch](/model/branch.md) drift denormalized at ingest** against the detected
   default branch's tip (by hash, one revision walk); default = 0/0; at most one
   `isDefault = true`; unreachable tips degrade to 0/0, never fail the ingest.

# Constraint bootstrap (run at API startup, before any ingest)

`@neo4j/graphql` v7's `@id` creates NO constraints and
`assertIndexesAndConstraints` verifies only fulltext/vector indexes. Without this
block, every MERGE in an UNWIND batch is a label scan - O(N^2) ingestion that
silently crawls:

```cypher
CREATE CONSTRAINT repository_id IF NOT EXISTS FOR (n:Repository) REQUIRE n.id IS UNIQUE;
CREATE CONSTRAINT author_id     IF NOT EXISTS FOR (n:Author)     REQUIRE n.id IS UNIQUE;
CREATE CONSTRAINT commit_id     IF NOT EXISTS FOR (n:Commit)     REQUIRE n.id IS UNIQUE;
CREATE CONSTRAINT file_id       IF NOT EXISTS FOR (n:File)       REQUIRE n.id IS UNIQUE;
CREATE CONSTRAINT branch_id     IF NOT EXISTS FOR (n:Branch)     REQUIRE n.id IS UNIQUE;
CREATE INDEX commit_committed_at IF NOT EXISTS FOR (n:Commit) ON (n.committedAt);
CREATE INDEX commit_hash         IF NOT EXISTS FOR (n:Commit) ON (n.hash);
CREATE INDEX file_path           IF NOT EXISTS FOR (n:File)   ON (n.path);
```

# Single writer

The graph is a projection of Git history; the ONLY writer is the ingestion service.
Generated GraphQL mutations are disabled schema-wide (see the
[GraphQL API](/contracts/graphql-api.md)), and `triggerIngestion` /
`cloneRepository` share one writer lock.
