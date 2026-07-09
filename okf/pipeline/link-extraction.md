---
type: Pipeline Stage
title: Link extraction
description: Parse the body to a markdown AST; only real link nodes yield edges, so code fences can never leak links.
resource: packages/core/src/links.ts
tags: [pipeline, parser, remark]
timestamp: 2026-07-09T00:00:00Z
---

The body is parsed to a markdown AST with `remark` (GFM enabled), and only two
node kinds produce candidate links: `link` (inline `[text](href)`) and
`definition` (reference-style `[label]: href`).

Everything else is content. Text inside fenced or inline code parses as
`code` / `inlineCode` AST nodes, which are never links - so a Cypher snippet, a
shell example, or a markdown sample inside a fence produces zero edges *by
construction*, not by filtering. The reasoning lives in
[the AST-based links decision](/decisions/ast-based-links.md).

Candidate hrefs are handed to [resolution](/pipeline/resolve.md) to become
edges or broken-link records.
