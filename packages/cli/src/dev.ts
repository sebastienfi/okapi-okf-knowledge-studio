import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { serve } from '@hono/node-server';
import { makeAiRegistrar, resolveAiConfig } from './ai';
import { Bundle } from './bundle';
import { createApp } from './server';
import { EventHub } from './sse';
import { Watcher } from './watch';

/**
 * Dev API server. Run behind the Vite dev server (which proxies /api here) so
 * the frontend gets HMR while hitting a live API + file watch on a real bundle.
 */

// Default to the repo's reference bundle regardless of the process cwd
// (pnpm runs this in packages/cli). User-supplied paths resolve from the
// directory where `pnpm dev` was invoked (INIT_CWD), i.e. the repo root.
const defaultBundle = fileURLToPath(new URL('../../../fixtures/strata', import.meta.url));
const supplied = process.argv[2] ?? process.env.OKAPI_BUNDLE;
const bundlePath = supplied
  ? path.resolve(process.env.INIT_CWD ?? process.cwd(), supplied)
  : defaultBundle;
const port = Number.parseInt(process.env.OKAPI_PORT ?? '4317', 10);

const bundle = await Bundle.open(bundlePath);
const hub = new EventHub();
const watcher = new Watcher(bundle, hub);
watcher.start();

// Enable AI in dev when a provider key is present (developer's own machine).
const aiConfig = resolveAiConfig({ ai: true, provider: process.env.OKAPI_PROVIDER });

const app = createApp({
  bundle,
  hub,
  publicDir: path.resolve('.nonexistent-dev-public'),
  version: 'dev',
  markSelfWrite: (rel) => watcher.markSelfWrite(rel),
  registerAi: makeAiRegistrar(bundle, aiConfig),
});

serve({ fetch: app.fetch, port, hostname: '127.0.0.1' });
console.log(
  `Okapi dev API → http://127.0.0.1:${port}  (bundle: ${bundle.root}${aiConfig.enabled ? `, AI: ${aiConfig.provider}` : ''})`,
);
