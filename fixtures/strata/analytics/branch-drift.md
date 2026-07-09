---
type: Metric
title: Branch drift
description: Ahead/behind-the-default counts per branch, denormalized at ingest.
resource: apps/api/src/schema/type-defs.ts
tags: [analytics, branches, drift]
timestamp: 2026-07-09T00:00:00Z
---

Not a `@cypher` computation: drift is read straight off the denormalized
[Branch](/model/branch.md) properties (`isDefault`, `aheadCount`, `behindCount`,
`tipCommittedAt`) via the generated `Repository.branches` field. O(branches) at
request time, zero `PARENT*` traversal.

# Reading it

- `behindCount` = commits on the default branch this branch lacks - the
  **integration-risk** signal (the eventual merge/rebase grows with it).
- `aheadCount` = unmerged work stranded on the branch.
- `tipCommittedAt` (committer date) = staleness; an old tip that is far behind is the
  classic abandoned-branch shape.
- The default branch is the baseline and always 0/0.

# Freshness caveat

Values are as of the last ingest, not live. Re-ingesting refreshes them (branches
are rebuilt from refs each run). This metric ignores the
[analysis window](/analytics/analysis-window.md) - drift is a "now" property, and the
dashboard's drift widget says "all history" explicitly.

# Verification anchor

Live-verified against a cloned `expressjs/express` (17 branches): branch `4.x`
reported 299 ahead / 33 behind, matching `git rev-list --left-right --count` exactly.

# Consumers

Branch-drift widget in the [dashboard](/systems/web.md); the BRANCH_DRIFT
[insight](/analytics/insights.md) (severity from behind-count and tip age).
