import { defineConfig } from 'tsup';

export default defineConfig({
  entry: { cli: 'src/cli.ts' },
  format: ['esm'],
  target: 'node20',
  platform: 'node',
  // Bundle first-party code (incl. @okapi/core) so the published package is self-contained.
  noExternal: [/@okapi\//],
  banner: { js: '#!/usr/bin/env node' },
  clean: false,
  sourcemap: true,
  minify: false,
  dts: false,
});
