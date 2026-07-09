---
type: Web Feature
title: Editor
description: In-place CodeMirror editing with edit/split/preview modes and conflict-safe saves.
resource: apps/web/src/features/detail/EditorPane.tsx
tags: [web, editor, codemirror]
timestamp: 2026-07-09T00:00:00Z
---

Any concept can be edited without leaving the studio. The editor is
CodeMirror 6 with markdown syntax support and three layouts: edit, split, and
preview (the preview renders exactly like the
[detail panel](/web/detail-panel.md)).

Saving goes through the [save protocol](/api/save-protocol.md): the editor
keeps the content hash it opened with, and a save is refused with a conflict
if the file changed on disk in the meantime - the server returns the current
disk content so nothing is silently lost. Writes are atomic on the server
side.

After a save the graph rebuilds and every open tab refreshes over SSE; the
saving tab itself skips the echo.
