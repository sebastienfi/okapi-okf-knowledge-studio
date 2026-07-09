import fs from 'node:fs';
import path from 'node:path';
import { analyzeBody, splitFrontmatter, stripBom } from '@okapi/core';
import type { Bundle } from '../bundle';

const MAX_NODES = 40;
const MAX_CONTEXT_CHARS = 60_000;
const PER_NODE_CHARS = 4_000;

interface CachedText {
  mtime: string;
  text: string;
}
const textCache = new Map<string, CachedText>();

function nodeText(root: string, id: string, mtime: string): string {
  const key = `${root}::${id}`;
  const hit = textCache.get(key);
  if (hit && hit.mtime === mtime) return hit.text;
  let text = '';
  try {
    const raw = stripBom(fs.readFileSync(path.join(root, id), 'utf8'));
    text = analyzeBody(splitFrontmatter(raw).body).text;
  } catch {
    text = '';
  }
  textCache.set(key, { mtime, text });
  return text;
}

function tokenize(s: string): string[] {
  return (s.toLowerCase().match(/[a-z0-9]{3,}/g) ?? []).filter((w, i, a) => a.indexOf(w) === i);
}

/**
 * Assemble grounding context for a question by lexically ranking concept nodes
 * (title weighted higher than body) and concatenating the top matches up to a
 * character budget. For small bundles this is effectively "include everything".
 */
export function buildContext(
  bundle: Bundle,
  question: string,
): { context: string; sources: string[] } {
  const terms = tokenize(question);
  const concepts = bundle.graph.nodes.filter((n) => !n.isSystem);

  const scored = concepts.map((n) => {
    const body = nodeText(bundle.root, n.id, n.mtime);
    const hayTitle = `${n.title} ${n.type ?? ''} ${n.tags.join(' ')}`.toLowerCase();
    const hayBody = body.toLowerCase();
    let score = 0;
    for (const t of terms) {
      if (hayTitle.includes(t)) score += 5;
      const inBody = hayBody.split(t).length - 1;
      score += Math.min(inBody, 5);
    }
    return { node: n, body, score };
  });

  scored.sort((a, b) => b.score - a.score || b.node.degree - a.node.degree);

  const picked = terms.length === 0 ? scored : scored.filter((s) => s.score > 0);
  const chosen = (picked.length ? picked : scored).slice(0, MAX_NODES);

  const parts: string[] = [];
  const sources: string[] = [];
  let total = 0;
  for (const { node, body } of chosen) {
    const snippet = body.slice(0, PER_NODE_CHARS);
    const block = `### ${node.title}  (path: /${node.id})${node.type ? `  [${node.type}]` : ''}\n${node.description ? `${node.description}\n` : ''}${snippet}`;
    if (total + block.length > MAX_CONTEXT_CHARS && parts.length > 0) break;
    parts.push(block);
    sources.push(node.id);
    total += block.length;
  }

  const context = `You have access to these concepts from the "${bundle.graph.meta.bundleName}" OKF bundle:\n\n${parts.join('\n\n')}`;
  return { context, sources };
}
