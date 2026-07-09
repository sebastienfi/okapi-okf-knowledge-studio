---
type: Pipeline Stage
title: Conformance
description: The OKF spec §9 verdict per file, plus the stricter opt-in checks behind `--strict`.
resource: packages/core/src/conformance.ts
tags: [pipeline, conformance, okf-spec]
timestamp: 2026-07-09T00:00:00Z
---

Every non-reserved file gets a spec §9 verdict. A file conforms when:

1. Its frontmatter parses as a YAML mapping (or is absent - but then rule 2 fails).
2. It has a non-empty `type` field - the one field consumers route on.
3. Every segment of its concept id is a filesystem-safe slug.

`index.md` and `log.md` are reserved files, exempt by definition.

# Strict mode

OKF itself requires only `type`. The reference *producer* tooling is stricter,
so `okapi lint --strict` (see [lint a bundle](/playbooks/lint-a-bundle.md))
additionally reports missing `title`, `description`, or `timestamp` - authoring
all four is defensive, maximizing compatibility with the strictest consumer.

# Permissive by design

OKF bets that knowledge is authored incrementally and never complete: unknown
`type` values and extra frontmatter keys are tolerated, and a broken link is a
gap to fill later, not a defect. Conformance is the floor that keeps a bundle
machine-readable, not a gate that demands it be finished.
