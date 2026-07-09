---
type: Tool
title: /strata skill
description: The terminal/AI-agent face - sync, ingest, and analyze any repo from its own Claude Code session.
resource: .claude/skills/strata/SKILL.md
tags: [skill, agent, cli]
timestamp: 2026-07-09T00:00:00Z
---

A Claude Code skill that runs the same engine from ANY repo's session: it syncs the
cwd repo into the engine, ingests if stale, pulls the
[analytics](/analytics/index.md) + [insights](/analytics/insights.md) over GraphQL,
layers the agent's own codebase reading on top, and ends in plan mode with concrete,
code-grounded actions.

# Installation

`pnpm install-strata` registers two symlinks: `~/.claude/skills/strata` -> the
in-repo skill dir (source of truth: `.claude/skills/strata/`), and
`~/.strata-repos` -> `target_repos/`. A symlink pointing INTO `target_repos/` from
outside is fine; only links placed INSIDE it dangle in the container (see the
[add-a-repository playbook](/playbooks/add-repository.md)).

# Operating facts

- `strata.sh` derives the project root from its own physical path
  (`readlink -f`), so first run can self-create `~/.strata-repos` and auto-start
  the stack (`docker compose up -d`) from any cwd.
- **Freshness is computed on the synced copy, never the cwd**: sync (clone once;
  `remote set-url` + `fetch --prune --tags` after; a root-commit lineage check tells
  a moved repo from a name collision), then compare `commitCount` vs
  `indexedCommitCount` from `mountedRepositories` - both use the ingester's exact
  ref set. A cwd `rev-list` count has a different ref set and reads permanently
  stale.
- Self case: when the cwd IS the engine repo, it uses the live overlay
  (`/repos/candidate-challenge`) and never copies the project into its own
  `target_repos/`.
- No-jq contract: the script emits raw GraphQL JSON for the AI to parse; bash only
  pattern-matches `"errors"` and the `ingestionStatus` value, because Yoga returns
  GraphQL errors as HTTP 200.

Exposing the same three operations as an MCP server is the documented next step.
