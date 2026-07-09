---
type: Playbook
title: Release
description: How a change becomes an npm version and prebuilt binaries, via Changesets.
resource: .github/workflows/release.yml
tags: [playbook, release, ci]
timestamp: 2026-07-09T00:00:00Z
---

Releases are driven by [Changesets](https://github.com/changesets/changesets):

1. Land a user-facing change with a changeset (`pnpm changeset`) describing
   the bump (patch/minor/major) in the PR.
2. The release workflow accumulates changesets into a "Version Packages" PR
   that bumps versions and updates the changelog.
3. Merging that PR publishes the [CLI package](/architecture/cli.md) to npm as
   `okapi-okf` and builds standalone binaries (no Node required) for the
   GitHub release.

The web app needs no separate release: its built assets ship inside the CLI
package, so one version covers the whole studio.

# What counts as user-facing

New CLI flags, API or UI behavior, parsing changes. Internal refactors, test
changes, and edits to this documentation bundle do not need a changeset.
