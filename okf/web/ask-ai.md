---
type: Web Feature
title: Ask
description: Opt-in AI answers grounded in the bundle, streamed with citations that light up the graph.
resource: apps/web/src/features/ai/AskPanel.tsx
tags: [web, ai, ask]
timestamp: 2026-07-09T00:00:00Z
---

Ask lets you query the bundle in plain English. It is **off by default**: the
[CLI](/architecture/cli.md) only registers the AI routes when started with
`--ai` and an `OPENAI_API_KEY` or `ANTHROPIC_API_KEY` is present - bring your
own key, you control the spend. Everything else in Okapi works fully offline.

When a question is asked, the relevant concept text is selected from the
bundle and sent with the question to the provider; the answer streams back
token by token and renders as markdown.

Answers carry **citation chips** - each one names the concept the claim came
from, and clicking it focuses that node on the
[graph canvas](/web/graph-canvas.md). An answer you cannot trace back to the
bundle is an answer you should not trust.
