# Changesets

This folder is managed by [Changesets](https://github.com/changesets/changesets).
Add a changeset for any user-facing change:

```bash
pnpm changeset
```

On merge to `main`, the Release workflow opens a "Version Packages" PR; merging
that publishes `okapi-okf` to npm with provenance.
