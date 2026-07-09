# Design Decision

* [Node identity scheme](identity.md) - How every node gets a unique id in a multi-repo database, and why authors are global.

# Graph Node

* [Author](author.md) - A commit author, identified globally by email across all repositories.
* [Branch](branch.md) - A Git ref pointing at its tip commit, carrying denormalized drift-vs-default metrics.
* [Commit](commit.md) - One Git commit with denormalized change totals; the center of the graph.
* [File](file.md) - A repo-scoped file path with materialized directory and exists-at-HEAD flag.
* [Repository](repository.md) - One ingested Git repository; the anchor node every analytic scopes to.

# Graph Relationship

* [AUTHORED](authored.md) - Author-to-Commit edge; exactly one per commit, the invariant every analytic depends on.
* [CONTRIBUTES_TO](contributes-to.md) - Author-to-Repository edge materialized at ingest for cheap contributor listings.
* [HAS_COMMIT / HAS_FILE / HAS_BRANCH](membership-edges.md) - Per-label repository membership edges (no generic IN_REPO).
* [MODIFIED](modified.md) - Commit-to-File edge carrying per-change additions/deletions (null for binaries).
* [PARENT](parent.md) - Commit lineage edge with parent order; forms the commit DAG.
* [POINTS_TO](points-to.md) - Branch-to-tip-commit pointer; reachable history derives from PARENT edges.
