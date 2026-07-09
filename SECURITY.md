# Security Policy

## Reporting a vulnerability

Please report security issues privately via [GitHub Security Advisories](https://github.com/okf-tools/okapi/security/advisories/new)
rather than opening a public issue. We aim to respond within a few business days.

## Security model

Okapi runs a **local** web server that reads and writes files in the bundle
directory you point it at. Two areas warrant attention:

### Writing to disk

Okapi can edit `.md` files in the bundle. Every read/write goes through a single
path-resolution choke point (`resolveInBundle`) that:

- rejects absolute paths, `..` traversal, and null bytes;
- confirms the resolved path stays inside the bundle root;
- re-checks the realpath of the parent directory to defeat symlink escape;
- only permits `.md` targets, and only files that already exist in the parsed graph.

Writes are atomic (temp file + fsync + rename) and byte-preserving. Saves use an
optimistic-concurrency hash so an external change is detected (HTTP 409) rather
than clobbered.

By default the server binds to `127.0.0.1` only. Do not expose it to untrusted
networks (`--host 0.0.0.0`) unless you understand that it grants read/write access
to the bundle.

### AI features

AI is **off by default**. When enabled with `--ai`, the concept text relevant to
your question plus the question itself are sent to the selected provider —
OpenAI (default) or Anthropic — using your own API key (`OPENAI_API_KEY` /
`ANTHROPIC_API_KEY`). No bundle content leaves your machine unless you both
enable AI and ask a question.
