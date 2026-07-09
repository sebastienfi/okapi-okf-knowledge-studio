import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { serve } from '@hono/node-server';
import { Command } from 'commander';
import getPort from 'get-port';
import { createSpinner } from 'nanospinner';
import open from 'open';
import pc from 'picocolors';
import { makeAiRegistrar, resolveAiConfig } from './ai';
import { Bundle } from './bundle';
import { lintBundle } from './lint';
import { createApp } from './server';
import { EventHub } from './sse';
import { banner } from './ui';
import { Watcher } from './watch';

const VERSION = '0.1.0';

function publicDir(): string {
  // dist/public sits next to the built cli.js; in dev this simply won't exist.
  return path.join(path.dirname(fileURLToPath(import.meta.url)), 'public');
}

interface ViewerOptions {
  port: number;
  host: string;
  open: boolean;
  watch: boolean;
  ai: boolean;
  provider?: string;
}

async function runViewer(bundlePath: string, opts: ViewerOptions): Promise<void> {
  banner(VERSION);
  const spinner = createSpinner('Parsing bundle…').start();

  let bundle: Bundle;
  try {
    bundle = await Bundle.open(bundlePath);
  } catch (err) {
    spinner.error({ text: pc.red((err as Error).message) });
    process.exitCode = 1;
    return;
  }

  const counts = bundle.graph.meta.counts;
  spinner.success({
    text: `Parsed ${pc.bold(bundle.graph.meta.bundleName)} — ${counts.concepts} concepts, ${counts.edges} links${
      counts.brokenLinks ? pc.yellow(`, ${counts.brokenLinks} broken`) : ''
    }`,
  });

  const hub = new EventHub();
  const watcher = opts.watch ? new Watcher(bundle, hub) : null;
  watcher?.start();

  const aiConfig = resolveAiConfig({ ai: opts.ai, provider: opts.provider });
  if (opts.ai && !aiConfig.enabled) {
    console.log(
      pc.yellow(
        '  ⚠ --ai set but no API key found (OPENAI_API_KEY or ANTHROPIC_API_KEY); AI stays off.',
      ),
    );
  } else if (aiConfig.enabled) {
    console.log(
      `  ${pc.magenta('✦')} AI: on ${pc.dim(`(${aiConfig.provider} · ${aiConfig.model})`)}`,
    );
  }

  const app = createApp({
    bundle,
    hub,
    publicDir: publicDir(),
    version: VERSION,
    markSelfWrite: (rel) => watcher?.markSelfWrite(rel),
    registerAi: makeAiRegistrar(bundle, aiConfig),
  });

  const candidates = Array.from({ length: 25 }, (_, i) => opts.port + i);
  const port = await getPort({ port: candidates });
  const server = serve({ fetch: app.fetch, port, hostname: opts.host });

  const displayHost = opts.host === '0.0.0.0' ? 'localhost' : opts.host;
  const url = `http://${displayHost}:${port}`;
  console.log(`  ${pc.green('➜')} ${pc.bold('Local:')}  ${pc.cyan(url)}`);
  console.log(`  ${pc.dim('Bundle:')} ${bundle.root}`);
  if (opts.watch) console.log(`  ${pc.dim('Watching for changes. Press Ctrl+C to stop.')}`);
  console.log('');

  if (opts.open) {
    await open(url).catch(() => {
      /* headless environments: ignore */
    });
  }

  let shuttingDown = false;
  const shutdown = async () => {
    if (shuttingDown) return;
    shuttingDown = true;
    console.log(pc.dim('\nShutting down…'));
    await watcher?.stop();
    server.close();
    process.exit(0);
  };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

interface LintCliOptions {
  strict?: boolean;
  checkLinks?: boolean;
  json?: boolean;
}

async function runLint(bundlePath: string, opts: LintCliOptions): Promise<void> {
  let result: Awaited<ReturnType<typeof lintBundle>>;
  try {
    result = await lintBundle(path.resolve(bundlePath), {
      strict: opts.strict,
      checkLinks: opts.checkLinks,
    });
  } catch (err) {
    console.error(pc.red((err as Error).message));
    process.exitCode = 2;
    return;
  }

  if (opts.json) {
    console.log(JSON.stringify(result, null, 2));
    process.exitCode = result.conformant ? 0 : 1;
    return;
  }

  for (const line of result.dangling) console.log(pc.yellow(`LINK  ${line}`));
  for (const line of result.missing) console.log(pc.red(`ERROR ${line}`));
  for (const line of result.errors) console.log(pc.red(`ERROR ${line}`));

  const { counts } = result.graph.meta;
  const mode = opts.strict ? 'strict' : 'spec §9';
  if (result.conformant) {
    console.log(
      pc.green(`\nCONFORMANT (${mode}): ${counts.concepts} concept(s), ${counts.nodes} file(s).`),
    );
    process.exitCode = 0;
  } else {
    const errorCount = result.errors.length + result.missing.length;
    console.log(
      pc.red(
        `\nNOT CONFORMANT (${mode}): ${errorCount} error(s) across ${counts.concepts} concept(s).`,
      ),
    );
    process.exitCode = 1;
  }
}

const program = new Command();
program
  .name('okapi')
  .description('Okapi — an OKF Knowledge Studio. Visualize, explore, audit and query OKF bundles.')
  .version(VERSION, '-v, --version');

program
  .argument('[bundle]', 'path to an OKF bundle directory', '.')
  .option(
    '-p, --port <number>',
    'preferred port (auto-increments if taken)',
    (v) => Number.parseInt(v, 10),
    4317,
  )
  .option('--host <host>', 'host to bind', '127.0.0.1')
  .option('--no-open', 'do not open the browser automatically')
  .option('--no-watch', 'do not watch the bundle for changes')
  .option('--ai', 'enable AI features (requires an API key)', false)
  .option(
    '--provider <name>',
    'AI provider: openai | anthropic (default: openai if its key is set)',
  )
  .action((bundle: string, opts: ViewerOptions) => runViewer(bundle, opts));

program
  .command('lint')
  .argument('[bundle]', 'path to an OKF bundle directory', '.')
  .description('Check OKF conformance (mirrors the reference validator)')
  .option('--strict', 'also require title/description/timestamp')
  .option('--check-links', 'report dangling intra-bundle links (informational)')
  .option('--json', 'output machine-readable JSON')
  .action((bundle: string, opts: LintCliOptions) => runLint(bundle, opts));

program.parseAsync().catch((err) => {
  console.error(pc.red(err instanceof Error ? err.message : String(err)));
  process.exit(1);
});
