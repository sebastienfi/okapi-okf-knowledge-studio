# Architecture

Okapi is a pnpm monorepo, TypeScript end-to-end, pure ESM.

```
packages/core   Pure OKF parser + shared types. No HTTP, no side effects.
packages/cli    Hono server + `okapi` CLI. Published to npm as "okapi-okf".
apps/web        React + Vite SPA. Built assets ship inside the CLI package.
okf/            Okapi's own OKF bundle (dogfood; default dev bundle).
fixtures/       Crafted edge-case bundles for parser tests.
```

## The two graphs

Okapi does **not** render the OKF bundle Graph. 
It renders the **document graph**: one node per `.md` file, one edge
per markdown link between files. Keeping these separate is essential — Cypher
snippets and diagrams in concept bodies are content, not edges.

## Parser (`packages/core`)

Pipeline: **walk → parse → resolve → build graph → degrees + conformance**.

- **Walk** — `fast-glob` for `**/*.md`, symlinks not followed.
- **Frontmatter** — split on `---`, parsed with `js-yaml`. Mirrors the reference
  validator: a file not starting with `---` has no frontmatter; an unterminated
  block or a non-mapping is a recorded parse error (never a crash). The bundle-root
  `index.md`'s bare `okf_version:` line is special-cased.
- **Link extraction** — the body is parsed to a markdown AST (`remark`), and only
  `link`/`definition` nodes yield edges. Fenced/inline code is never a link node,
  so Cypher and code samples produce **zero** edges by construction.
- **Resolution** — mirrors `validate_okf.py`: skip external/anchor links, strip
  fragments, resolve `/`-absolute from the bundle root and relative from the file's
  directory, reject `..` escapes, keep only in-bundle `.md`. A link to a missing
  in-bundle `.md` is a **broken link** recorded on the source node, never a
  dangling edge.
- **Nodes** carry `type` (drives color), `degree` (drives size), `conformance`,
  `brokenLinks`, and all unknown frontmatter keys (preserved verbatim).

The parser is the single source of truth: the graph API, `okapi lint`, and the
Insights panel all read from it.

## Server (`packages/cli`)

A [Hono](https://hono.dev) app holds the parsed bundle in memory and exposes:

| Route                                    | Purpose                                             |
| ---------------------------------------- | --------------------------------------------------- |
| `GET /api/graph`                         | Nodes + edges + bundle meta (no bodies)             |
| `GET /api/node?path=`                    | One node: raw content, frontmatter, neighbors, hash |
| `PUT /api/node?path=`                    | Save (atomic, path-guarded, 409 on stale hash)      |
| `GET /api/report`, `/api/lint`           | Health + OKF conformance                            |
| `GET /api/events`                        | SSE — bundle-changed notifications (file watch)     |
| `GET /api/ai/status`, `POST /api/ai/ask` | AI (opt-in)                                         |
| `GET /api/files/*`                       | Non-md assets referenced by markdown                |
| `GET *`                                  | The built SPA (with fallback)                       |

`chokidar` watches the bundle and pushes `bundle-changed` over SSE; the browser
refetches. Node identity travels as a `?path=` query param so the traversal guard
is the single choke point.

## Frontend (`apps/web`)

- **Graph** — `react-force-graph-2d` (canvas) with `nodeVal=degree`, per-type color,
  hover-neighborhood highlight, click-to-focus. Node objects are cached across
  refetches so positions persist.
- **State** — TanStack Query (server cache), Zustand (ephemeral UI), URL hash
  (deep-linkable selection). Tokens are CSS variables so light/dark swaps are pure CSS.
- **Detail** — `react-markdown` + `rehype-highlight`; internal `.md` links navigate
  the graph instead of loading a page. Editing uses CodeMirror 6 with edit/split/preview.
- **Insights** — computed client-side from the graph payload (union-find for
  disconnected groups).
- **Ask** — streams `POST /api/ai/ask` (SSE) and renders the answer as markdown
  with citation chips that focus the cited node.

## Packaging

The web app builds into `packages/cli/dist/public`; `tsup` bundles the CLI (with
`@okapi/core` inlined) into `dist/cli.js`. So `npx okapi-okf` needs no build step.
All v1 runtime deps are pure-JS, which also lets CI produce standalone binaries.
