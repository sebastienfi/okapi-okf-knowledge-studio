---
type: Design Decision
title: The path is the identity
description: A concept's id is its file path; renames are identity changes, and broken links are gaps rather than errors.
resource: packages/core/src/resolve.ts
tags: [decision, identity, links]
timestamp: 2026-07-09T00:00:00Z
---

A concept's id is its path within the bundle with `.md` removed:
`pipeline/walk.md` is the concept `pipeline/walk`. There is no separate id
registry, no UUID frontmatter field. The filesystem *is* the namespace.

# Consequences

* **Renaming or moving a file renames the concept** and silently breaks every
  inbound link to it - nothing rewrites links. [Resolution](/pipeline/resolve.md)
  records those as broken links on the linking files.
* **Broken links are gaps, not errors.** OKF bets that knowledge is authored
  incrementally: a link to a not-yet-written concept is a promise, and the
  [Insights panel](/web/insights.md) surfaces it as work to do, never as a
  reason to reject the bundle.
* **Bundle-absolute links age best.** A `/`-rooted link keeps working when the
  *linking* file moves; only moving the *target* breaks it. That is why this
  bundle links everything from the root.

The payoff for the constraint: identity is trivially inspectable (`ls` shows
you every concept), diffs are honest, and two bundles can be merged with `cp`.
