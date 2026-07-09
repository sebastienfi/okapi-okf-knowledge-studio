import { createHash } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { checkConformance } from './conformance';
import { readOkfVersion, splitFrontmatter, stripBom } from './frontmatter';
import { type RawLink, analyzeBody } from './links';
import { resolveTarget } from './resolve';
import type {
  BundleMeta,
  GraphEdge,
  GraphNode,
  GraphResponse,
  Neighbor,
  NodeDetail,
} from './types';
import { coerceString, coerceStringArray, humanizeTitle } from './util';
import { walkMarkdown } from './walk';

const RESERVED = new Set(['index.md', 'log.md']);
const KNOWN_KEYS = new Set(['type', 'title', 'description', 'resource', 'tags', 'timestamp']);

interface ParsedFile {
  node: GraphNode;
  links: RawLink[];
  okfVersion: string | null;
  raw: string;
  body: string;
  frontmatter: Record<string, unknown>;
}

function toPosix(p: string): string {
  return p.split(path.sep).join('/');
}

async function parseFile(root: string, rel: string): Promise<ParsedFile> {
  const abs = path.join(root, rel);
  const stat = await fs.stat(abs);
  const raw = stripBom(await fs.readFile(abs, 'utf8'));

  const name = path.posix.basename(rel);
  const conceptId = rel.replace(/\.md$/i, '');
  const dir = path.posix.dirname(rel) === '.' ? '' : path.posix.dirname(rel);
  const isSystem = RESERVED.has(name);
  const systemKind = name === 'index.md' ? 'index' : name === 'log.md' ? 'log' : null;

  const split = splitFrontmatter(raw);
  const data = split.data;
  const { links } = analyzeBody(split.body);
  const okfVersion = rel === 'index.md' ? readOkfVersion(raw) : null;

  const type = isSystem ? null : coerceString(data.type);
  const conformance = checkConformance({
    isSystem,
    conceptId,
    hasFrontmatter: split.hasFrontmatter,
    parseError: split.parseError,
    data,
  });

  const extra: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(data)) {
    if (!KNOWN_KEYS.has(k)) extra[k] = v instanceof Date ? v.toISOString() : v;
  }

  const title = isSystem
    ? systemKind === 'log'
      ? 'Update log'
      : dir === ''
        ? 'Bundle index'
        : `${dir} · index`
    : (coerceString(data.title) ?? humanizeTitle(name.replace(/\.md$/i, '')));

  const node: GraphNode = {
    id: rel,
    path: rel,
    conceptId,
    dir,
    name,
    title,
    type,
    description: isSystem ? null : coerceString(data.description),
    tags: isSystem ? [] : coerceStringArray(data.tags),
    timestamp: isSystem ? null : coerceString(data.timestamp),
    resource: isSystem ? null : coerceString(data.resource),
    isSystem,
    systemKind,
    hasFrontmatter: split.hasFrontmatter,
    degree: 0,
    inDegree: 0,
    outDegree: 0,
    conformance,
    brokenLinks: [],
    ...(split.parseError ? { parseError: split.parseError } : {}),
    extra,
    sizeBytes: stat.size,
    mtime: stat.mtime.toISOString(),
  };

  return { node, links, okfVersion, raw, body: split.body, frontmatter: data };
}

/** Build the full document graph for a bundle rooted at `root`. Reads the filesystem. */
export async function buildGraph(root: string): Promise<GraphResponse> {
  const rels = await walkMarkdown(root);
  const parsed = await Promise.all(rels.map((rel) => parseFile(root, rel)));

  const nodeMap = new Map<string, GraphNode>();
  for (const p of parsed) nodeMap.set(p.node.id, p.node);

  const edgeMap = new Map<string, GraphEdge>();
  let okfVersion: string | null = null;

  for (const p of parsed) {
    if (p.okfVersion) okfVersion = p.okfVersion;
    for (const link of p.links) {
      const target = resolveTarget(link.url, p.node.id);
      if (target === null) continue;
      if (target === p.node.id) continue; // drop self-loops
      if (nodeMap.has(target)) {
        const key = `${p.node.id}->${target}`;
        let edge = edgeMap.get(key);
        if (!edge) {
          edge = {
            id: key,
            source: p.node.id,
            target,
            kind: 'link',
            weight: 0,
            labels: [],
            fromSystem: p.node.isSystem,
          };
          edgeMap.set(key, edge);
        }
        edge.weight += 1;
        const label = link.label.trim();
        if (label && !edge.labels.includes(label)) edge.labels.push(label);
      } else if (!p.node.brokenLinks.some((b) => b.resolved === target)) {
        p.node.brokenLinks.push({ raw: link.url, resolved: target });
      }
    }
  }

  const edges = [...edgeMap.values()];
  for (const edge of edges) {
    const source = nodeMap.get(edge.source);
    const target = nodeMap.get(edge.target);
    if (source) source.outDegree += 1;
    if (target) target.inDegree += 1;
  }
  for (const node of nodeMap.values()) node.degree = node.inDegree + node.outDegree;

  const nodes = [...nodeMap.values()];
  const concepts = nodes.filter((n) => !n.isSystem);
  const typeCounts = new Map<string, number>();
  for (const n of concepts) {
    if (n.type) typeCounts.set(n.type, (typeCounts.get(n.type) ?? 0) + 1);
  }
  const brokenLinks = nodes.reduce((sum, n) => sum + n.brokenLinks.length, 0);

  const meta: BundleMeta = {
    bundleName: path.basename(path.resolve(root)),
    okfVersion,
    generatedAt: new Date().toISOString(),
    counts: {
      nodes: nodes.length,
      concepts: concepts.length,
      system: nodes.length - concepts.length,
      edges: edges.length,
      brokenLinks,
    },
    types: [...typeCounts]
      .map(([type, count]) => ({ type, count }))
      .sort((a, b) => b.count - a.count || a.type.localeCompare(b.type)),
  };

  return { meta, nodes, edges };
}

/** Neighbors of a node, derived from the edge list, for the detail panel. */
export function computeNeighbors(
  nodeId: string,
  edges: GraphEdge[],
  nodesById: Map<string, GraphNode>,
): Neighbor[] {
  const neighbors: Neighbor[] = [];
  const seen = new Set<string>();
  for (const edge of edges) {
    if (edge.kind !== 'link') continue;
    let otherId: string | null = null;
    let direction: 'out' | 'in' | null = null;
    if (edge.source === nodeId) {
      otherId = edge.target;
      direction = 'out';
    } else if (edge.target === nodeId) {
      otherId = edge.source;
      direction = 'in';
    }
    if (!otherId || !direction) continue;
    const dedupeKey = `${direction}:${otherId}`;
    if (seen.has(dedupeKey)) continue;
    seen.add(dedupeKey);
    const other = nodesById.get(otherId);
    if (!other) continue;
    neighbors.push({ id: otherId, title: other.title, type: other.type, direction });
  }
  return neighbors.sort((a, b) => a.title.localeCompare(b.title));
}

export function sha256(text: string): string {
  return createHash('sha256').update(text, 'utf8').digest('hex');
}

/**
 * Compose full detail for a single node from a fresh read of its file plus the
 * in-memory graph. Used by GET /api/node. Reads the file so the returned hash
 * reflects the current on-disk bytes (for optimistic-concurrency saves).
 */
export async function readNodeDetail(
  root: string,
  node: GraphNode,
  edges: GraphEdge[],
  nodesById: Map<string, GraphNode>,
): Promise<NodeDetail> {
  const abs = path.join(root, node.id);
  const raw = stripBom(await fs.readFile(abs, 'utf8'));
  const split = splitFrontmatter(raw);
  const stat = await fs.stat(abs);
  return {
    node,
    raw,
    body: split.body,
    frontmatter: split.data,
    neighbors: computeNeighbors(node.id, edges, nodesById),
    hash: sha256(raw),
    mtime: stat.mtime.toISOString(),
  };
}

export { toPosix };
