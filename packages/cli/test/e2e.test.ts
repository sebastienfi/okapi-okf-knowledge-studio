import { type ChildProcess, spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

const here = path.dirname(fileURLToPath(import.meta.url));
const cliEntry = path.join(here, '../src/cli.ts');
// The repo's own documentation bundle doubles as the e2e fixture.
// Load-bearing: architecture/core.md (type: Package); the health check pins
// the bundle name 'okf' (basename of the bundle directory).
const bundleDir = path.join(here, '../../../okf');

// biome-ignore lint/suspicious/noExplicitAny: test convenience for JSON bodies
const readJson = (res: Response): Promise<any> => res.json() as Promise<any>;

let child: ChildProcess;
let baseUrl: string;

beforeAll(async () => {
  child = spawn(
    process.execPath,
    ['--import', 'tsx', cliEntry, bundleDir, '--no-open', '--no-watch', '--port', '4650'],
    { stdio: ['ignore', 'pipe', 'pipe'], cwd: path.join(here, '..') },
  );

  baseUrl = await new Promise<string>((resolve, reject) => {
    let out = '';
    const timer = setTimeout(() => reject(new Error(`CLI did not start:\n${out}`)), 30_000);
    const onData = (d: Buffer) => {
      out += d.toString();
      const m = /(http:\/\/[^\s]+:\d+)/.exec(out);
      if (m?.[1]) {
        clearTimeout(timer);
        resolve(m[1]);
      }
    };
    child.stdout?.on('data', onData);
    child.stderr?.on('data', (d: Buffer) => {
      out += d.toString();
    });
    child.on('exit', (code) => {
      clearTimeout(timer);
      reject(new Error(`CLI exited early (${code}):\n${out}`));
    });
  });

  for (let i = 0; i < 40; i++) {
    try {
      if ((await fetch(`${baseUrl}/api/health`)).ok) return;
    } catch {
      // not up yet
    }
    await new Promise((r) => setTimeout(r, 250));
  }
}, 40_000);

afterAll(() => {
  child?.kill('SIGTERM');
});

describe('e2e: the okapi CLI serves a real bundle', () => {
  it('reports health', async () => {
    const body = await readJson(await fetch(`${baseUrl}/api/health`));
    expect(body.ok).toBe(true);
    expect(body.bundle).toBe('okf');
  });

  it('serves the graph with consistent counts', async () => {
    const body = await readJson(await fetch(`${baseUrl}/api/graph`));
    expect(body.meta.counts.nodes).toBe(body.meta.counts.concepts + body.meta.counts.system);
    expect(body.meta.counts.concepts).toBeGreaterThanOrEqual(20);
    expect(body.meta.okfVersion).toBe('0.1');
  });

  it('serves a node with rendered detail', async () => {
    const body = await readJson(await fetch(`${baseUrl}/api/node?path=architecture/core.md`));
    expect(body.node.type).toBe('Package');
    expect(body.neighbors.length).toBeGreaterThan(0);
  });

  it('reports AI off by default', async () => {
    const body = await readJson(await fetch(`${baseUrl}/api/ai/status`));
    expect(body.enabled).toBe(false);
  });
});
