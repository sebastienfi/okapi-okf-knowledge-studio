# Contributing to Okapi

Thanks for your interest in improving Okapi!

## Setup

Requires **Node ≥ 20** and **pnpm 11**.

```bash
git clone https://github.com/okf-tools/okapi
cd okapi
pnpm install
```

## Running locally

There are two ways to run the version you're working on.

### Dev mode (hot reload) — for working on the frontend

```bash
pnpm dev
```

Runs two processes: the Vite dev server (`http://localhost:5173`, with HMR) and
the API server (`http://localhost:4317`) pointed at `fixtures/strata`. Vite
proxies `/api` to the API server, so the frontend hot-reloads against a live,
file-watched bundle. Open **http://localhost:5173**. Point it at another bundle
with `OKAPI_BUNDLE=./path/to/bundle pnpm dev`.

### Running your built changes — the real CLI, any bundle

```bash
pnpm build                                        # build web + cli into packages/cli/dist
node packages/cli/dist/cli.js ./path/to/bundle    # runs exactly like `npx okapi-okf`, opens the browser
```

`fixtures/strata` is a safe throwaway bundle to test editing/saving against.
Useful flags while testing: `--no-open`, `--no-watch`, `--port <n>`.

### Testing AI ("Ask the bundle")

AI is opt-in. Set a key and add `--ai`:

```bash
export OPENAI_API_KEY=sk-...          # or ANTHROPIC_API_KEY=sk-ant-...
node packages/cli/dist/cli.js fixtures/strata --ai
```

OpenAI is the default; pass `--provider anthropic` (or set `OKAPI_PROVIDER`) to
switch when both keys are present, and `OKAPI_MODEL` to override the model. With
a wrong/absent key the `Ask` panel still loads and surfaces the error — enough to
test the wiring without spending tokens.

### CLI-only checks

```bash
node packages/cli/dist/cli.js lint fixtures/strata --strict --check-links
```

## Before you push

```bash
pnpm lint         # Biome (lint + format check)
pnpm typecheck    # tsc --noEmit across all packages
pnpm test         # Vitest
pnpm build        # ensure web + cli build
```

All four run in CI on Node 20 and 22, across Ubuntu and Windows.

## Layout

- `packages/core` — the pure parser and shared types. **No HTTP, no side effects.** Every parsing rule has a fixture-backed unit test; add one when you change behavior.
- `packages/cli` — the Hono server and the `okapi` CLI (published as `okapi-okf`).
- `apps/web` — the React + Vite frontend.
- `fixtures/` — the reference bundle plus crafted edge cases the tests assert against.

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
