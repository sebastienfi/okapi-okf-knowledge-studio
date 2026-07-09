---
type: Pipeline Stage
title: Frontmatter
description: Split the YAML frontmatter block from the body and parse it; malformed input becomes a recorded error, never a crash.
resource: packages/core/src/frontmatter.ts
tags: [pipeline, parser, yaml]
timestamp: 2026-07-09T00:00:00Z
---

A concept document opens with a `---`-fenced YAML block. This stage splits it
from the markdown body and parses it with `js-yaml`, mirroring the OKF
reference validator's tolerances exactly:

| Input | Outcome |
|---|---|
| Well-formed block | Frontmatter map + body. |
| No opening `---` | Empty frontmatter, whole file is body. Silently fails [conformance](/pipeline/conformance.md) later (no `type`). |
| Opening `---` never closed | Recorded parse error: unterminated block. |
| Block is a list or scalar | Recorded parse error: frontmatter must be a YAML mapping. |
| Invalid YAML | Recorded parse error with the YAML message. |

Errors land on the node; parsing never throws.

The bundle-root `index.md` is special-cased: its optional bare
`okf_version: "0.1"` first line (outside any fence) is read here and surfaces
as the bundle's OKF version.

The body text flows on to [link extraction](/pipeline/link-extraction.md).
