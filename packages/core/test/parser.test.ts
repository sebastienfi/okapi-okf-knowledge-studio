import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { buildGraph } from '../src/graph';
import type { GraphEdge } from '../src/types';

const here = path.dirname(fileURLToPath(import.meta.url));
const fixtures = path.join(here, '../../../fixtures');
// The repo's own documentation bundle doubles as the "real bundle" fixture.
// Load-bearing files (renaming/unlinking them breaks assertions below):
//   overview.md, architecture/core.md, pipeline/index.md,
//   pipeline/link-extraction.md (links /pipeline/resolve.md),
//   decisions/ast-based-links.md (fenced fake link to /model/widget.md).
const okf = path.join(here, '../../../okf');

function edge(edges: GraphEdge[], source: string, target: string): GraphEdge | undefined {
  return edges.find((e) => e.source === source && e.target === target);
}

describe('buildGraph - the okf dogfood bundle', () => {
  it('counts nodes, concepts and system files correctly', async () => {
    const g = await buildGraph(okf);
    // Independent oracle: count the .md files on disk rather than hardcoding
    // totals, so the bundle can grow without breaking this test.
    const entries = await fs.readdir(okf, { recursive: true, withFileTypes: true });
    const mdFiles = entries.filter((d) => d.isFile() && d.name.endsWith('.md'));
    const system = mdFiles.filter((d) => d.name === 'index.md' || d.name === 'log.md').length;
    expect(g.meta.counts.nodes).toBe(mdFiles.length);
    expect(g.meta.counts.system).toBe(system);
    expect(g.meta.counts.concepts).toBe(mdFiles.length - system);
    expect(g.meta.counts.concepts).toBeGreaterThanOrEqual(20); // the bundle stays substantial
    expect(g.meta.okfVersion).toBe('0.1');
  });

  it('extracts real cross-links as directed edges', async () => {
    const g = await buildGraph(okf);
    expect(edge(g.edges, 'overview.md', 'architecture/core.md')).toBeDefined();
    expect(edge(g.edges, 'pipeline/link-extraction.md', 'pipeline/resolve.md')).toBeDefined();
    expect(edge(g.edges, 'index.md', 'pipeline/index.md')).toBeDefined();
  });

  it('never turns a `resource:` value or code fence into an edge', async () => {
    const g = await buildGraph(okf);
    // resource values point outside the bundle (packages/, apps/, docs/, ...):
    // no such nodes/edges may exist.
    for (const e of g.edges) {
      expect(e.target.endsWith('.md')).toBe(true);
      expect(e.target).not.toContain('packages/');
      expect(e.target).not.toContain('apps/');
      expect(e.target).not.toContain('docs/');
    }
    // decisions/ast-based-links.md carries a fenced `[not an edge](/model/widget.md)`
    // on purpose: it must produce neither an edge nor a broken link.
    expect(edge(g.edges, 'decisions/ast-based-links.md', 'model/widget.md')).toBeUndefined();
    const decision = g.nodes.find((n) => n.id === 'decisions/ast-based-links.md');
    expect(decision?.brokenLinks).toEqual([]);
  });

  it('marks index.md / log.md as system nodes with no frontmatter', async () => {
    const g = await buildGraph(okf);
    const rootIndex = g.nodes.find((n) => n.id === 'index.md');
    const log = g.nodes.find((n) => n.id === 'log.md');
    expect(rootIndex?.isSystem).toBe(true);
    expect(rootIndex?.systemKind).toBe('index');
    expect(log?.isSystem).toBe(true);
    expect(log?.systemKind).toBe('log');
  });

  it('sizes hub nodes higher (index files fan out)', async () => {
    const g = await buildGraph(okf);
    const pipelineIndex = g.nodes.find((n) => n.id === 'pipeline/index.md');
    expect(pipelineIndex?.degree ?? 0).toBeGreaterThan(5);
  });
});

describe('buildGraph — link resolution edge cases', () => {
  it('resolves absolute/relative links, dedupes fragments, ignores code & non-md', async () => {
    const g = await buildGraph(path.join(fixtures, 'edge-cases/links'));

    expect(g.meta.counts.nodes).toBe(4); // index.md + a.md + b.md + sub/c.md
    expect(g.meta.counts.concepts).toBe(3);
    expect(g.meta.counts.system).toBe(1);
    expect(g.meta.okfVersion).toBe('0.1');

    // real edges
    expect(edge(g.edges, 'index.md', 'a.md')).toBeDefined();
    const aToB = edge(g.edges, 'a.md', 'b.md');
    expect(aToB).toBeDefined();
    expect(aToB?.weight).toBe(2); // /b.md and /b.md#section collapse
    expect(edge(g.edges, 'a.md', 'sub/c.md')).toBeDefined();
    expect(edge(g.edges, 'b.md', 'a.md')).toBeDefined();
    expect(g.meta.counts.edges).toBe(4);

    // things that must NOT be edges
    const targets = g.edges.map((e) => e.target);
    expect(targets).not.toContain('also-not-an-edge.md'); // inside a cypher fence
    expect(targets).not.toContain('nope.md'); // inside inline code
    expect(targets.some((t) => t.includes('outside'))).toBe(false); // .. escape
    expect(targets.some((t) => t.endsWith('.png'))).toBe(false); // non-md

    // broken link recorded, not edged
    const a = g.nodes.find((n) => n.id === 'a.md');
    expect(a?.brokenLinks.map((b) => b.resolved)).toEqual(['does-not-exist.md']);
    expect(g.meta.counts.brokenLinks).toBe(1);
  });
});

describe('buildGraph — frontmatter edge cases', () => {
  it('handles good/unterminated/absent/list frontmatter without crashing', async () => {
    const g = await buildGraph(path.join(fixtures, 'edge-cases/frontmatter'));

    const good = g.nodes.find((n) => n.id === 'good.md');
    expect(good?.conformance.ok).toBe(true);
    expect(good?.type).toBe('Widget');
    expect(good?.tags).toEqual(['alpha', 'beta']);
    expect(good?.extra).toMatchObject({ owner: 'alice', custom_scores: [1, 2, 3] });
    expect(good?.conformance.missing).toEqual([]);

    const unterminated = g.nodes.find((n) => n.id === 'unterminated.md');
    expect(unterminated?.parseError).toContain('unterminated');
    expect(unterminated?.conformance.ok).toBe(false);

    const none = g.nodes.find((n) => n.id === 'no-frontmatter.md');
    expect(none?.hasFrontmatter).toBe(false);
    expect(none?.type).toBeNull();
    expect(none?.conformance.ok).toBe(false);

    const list = g.nodes.find((n) => n.id === 'list-frontmatter.md');
    expect(list?.parseError).toContain('mapping');
    expect(list?.conformance.ok).toBe(false);
  });
});
