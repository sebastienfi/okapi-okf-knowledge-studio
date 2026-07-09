---
type: Playbook
title: Lint a bundle
description: Check any bundle's OKF conformance from the command line - flags, verdicts, and exit codes.
resource: packages/cli/src/lint.ts
tags: [playbook, lint, conformance]
timestamp: 2026-07-09T00:00:00Z
---

```bash
okapi lint ./path/to/bundle --strict --check-links
```

Runs the same [conformance checks](/pipeline/conformance.md) as the OKF
reference validator and prints a verdict:

```
CONFORMANT (strict): 25 concept(s), 33 file(s).
```

| Flag | Effect |
|---|---|
| `--strict` | Missing `title`/`description`/`timestamp` become errors, not just advisories. |
| `--check-links` | Report dangling intra-bundle links as informational `LINK` lines. Never changes the verdict - a broken link is a gap, not a defect. |
| `--json` | Machine-readable output for CI pipelines. |

# Exit codes

| Code | Meaning |
|---|---|
| `0` | Conformant. |
| `1` | Not conformant (spec §9 errors, or strict-mode gaps with `--strict`). |
| `2` | The bundle could not be read at all. |

This repo lints its own bundle in CI - the integration tests assert that this
very documentation stays conformant and orphan-free.
