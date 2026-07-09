# Contributing to Okapi

Thanks for your interest in improving Okapi!

## Setup

Requires **Node ≥ 22.13** (pnpm 11 needs it) and **pnpm 11**. The published
`okapi-okf` package itself runs on Node ≥ 20 — the higher floor is only for local
development and CI.

```bash
git clone https://github.com/sebastienfi/okapi-okf-knowledge-studio
cd okapi-okf-knowledge-studio
pnpm install
```

## Running locally

There are two ways to run the version you're working on.

### Dev mode (hot reload) — for working on the frontend

```bash
pnpm dev
```

Runs two processes: the Vite dev server (`http://localhost:5173`, with HMR) and
the API server (`http://localhost:4317`) pointed at `okf/` — the bundle that
documents Okapi itself. Vite proxies `/api` to the API server, so the frontend
hot-reloads against a live, file-watched bundle. Open **http://localhost:5173**.
Point it at another bundle with `OKAPI_BUNDLE=./path/to/bundle pnpm dev`.

### Running your built changes — the real CLI, any bundle

```bash
pnpm build                                        # build web + cli into packages/cli/dist
node packages/cli/dist/cli.js ./path/to/bundle    # runs exactly like `npx okapi-okf`, opens the browser
```

`okf/` is Okapi's own documentation bundle — edits you make through the app
land in your working tree. Revert with `git checkout -- okf/`, or copy the
bundle somewhere temporary for destructive save testing.
Useful flags while testing: `--no-open`, `--no-watch`, `--port <n>`.

### Testing AI ("Ask the bundle")

AI is opt-in. Set a key and add `--ai`:

```bash
export OPENAI_API_KEY=sk-...          # or ANTHROPIC_API_KEY=sk-ant-...
node packages/cli/dist/cli.js okf --ai
```

OpenAI is the default; pass `--provider anthropic` (or set `OKAPI_PROVIDER`) to
switch when both keys are present, and `OKAPI_MODEL` to override the model. With
a wrong/absent key the `Ask` panel still loads and surfaces the error — enough to
test the wiring without spending tokens.

### CLI-only checks

```bash
node packages/cli/dist/cli.js lint okf --strict --check-links
```

## Before you push

```bash
pnpm lint         # Biome (lint + format check)
pnpm typecheck    # tsc --noEmit across all packages
pnpm test         # Vitest
pnpm build        # ensure web + cli build
```

All four run in CI on Node 22 and 24, across Ubuntu and Windows.

## Layout

- `packages/core` — the pure parser and shared types. **No HTTP, no side effects.** Every parsing rule has a fixture-backed unit test; add one when you change behavior.
- `packages/cli` — the Hono server and the `okapi` CLI (published as `okapi-okf`).
- `apps/web` — the React + Vite frontend.
- `okf/` — Okapi's own OKF bundle: the default dev bundle and the dogfood fixture for the integration tests (some files are load-bearing for tests; see the comments at the top of the test files).
- `fixtures/` — crafted edge-case bundles the parser tests assert against.

## Changesets

We use [Changesets](https://github.com/changesets/changesets) for versioning.
For any user-facing change, add one:

```bash
pnpm changeset
```

## Commit style

Conventional Commits are appreciated (`feat:`, `fix:`, `docs:`, `chore:`) but not enforced.

## Code of conduct

This project follows the [Contributor Covenant](CODE_OF_CONDUCT.md).
