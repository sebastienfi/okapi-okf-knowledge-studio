---
type: Playbook
title: Add a repository
description: The three supported ways to get a repo into the engine, and the symlink trap to avoid.
resource: docs/web-dashboard-brief.md
tags: [playbook, ingestion, operations]
timestamp: 2026-07-09T00:00:00Z
---

Prerequisite: the stack is up (`docker compose up --build`). Zero-setup demo: this
repo is bind-mounted, so ingesting `/repos/candidate-challenge` always works.

# 1. Dashboard (primary)

"Add repository" dialog in the [web dashboard](/systems/web.md), three tabs:

- **From disk** - disk-scan picker over `mountedRepositories`: indexed vs new,
  "+N new" staleness badge, size, re-ingest confirm.
- **Clone from GitHub** - `cloneRepository` by URL (PUBLIC GitHub HTTPS only), then
  auto-ingest. Two-phase, so a clone that fails to ingest stays visible in the disk
  picker for retry.
- **Add manually** - instructions + refresh, for repos you place yourself (below).

# 2. Drop into `target_repos/`

Clone or copy the repo INTO `./target_repos/` on the host (the mount is rw), then
ingest `"/repos/<name>"` via the dialog or the `triggerIngestion` mutation on the
[GraphQL API](/contracts/graphql-api.md).

**Never symlink.** A host symlink placed inside `./target_repos/` resolves on the
host but DANGLES inside the container (bind mounts do not follow links across the
mount boundary) - ingest dies with "Path does not exist". Clone or copy, always.

# 3. `/strata` from the repo's own session

The [/strata skill](/systems/strata-skill.md) syncs the cwd repo into
`target_repos/` and ingests it automatically, from any Claude Code session.

# Re-ingesting and freshness

Re-running `triggerIngestion` on the same path is idempotent (MERGE by
[identity](/model/identity.md) + the reset phase of the
[ingestion contract](/contracts/ingestion-contract.md)). Staleness shows as "+N new"
where on-disk `commitCount` exceeds `indexedCommitCount`. Large repos ingest
synchronously - poll `ingestionStatus`; concurrent runs are rejected.

# Known gaps

Private-repo SSH clone, delete-a-repo, and an async job model are documented
next steps. Manual delete today: remove the folder and delete the repo subgraph in
Cypher (or re-mount and re-ingest).
