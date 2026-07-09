# Pipeline Stage

The six stages of `buildGraph`, in execution order:

* [Walk](walk.md) - Enumerate every `.md` file under the bundle root; symlinks are not followed.
* [Frontmatter](frontmatter.md) - Split the YAML frontmatter block from the body and parse it; malformed input becomes a recorded error, never a crash.
* [Link extraction](link-extraction.md) - Parse the body to a markdown AST; only real link nodes yield edges, so code fences can never leak links.
* [Resolution](resolve.md) - Turn each href into a bundle-relative `.md` target or reject it; missing targets are recorded as broken links.
* [Graph assembly](graph-assembly.md) - Build nodes and deduped weighted edges, compute degrees, and derive the bundle metadata.
* [Conformance](conformance.md) - The OKF spec §9 verdict per file, plus the stricter opt-in checks behind `--strict`.
