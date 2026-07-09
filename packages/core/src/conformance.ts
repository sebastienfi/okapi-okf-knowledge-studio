import type { Conformance } from './types';

/** OKF concept-id path segment rule (paths.py). */
const SEGMENT_RE = /^[A-Za-z0-9_][A-Za-z0-9_.\-]*$/;
/** Recommended (strict) keys beyond the required `type`. */
const STRICT_KEYS = ['title', 'description', 'timestamp'] as const;

export interface ConformanceInput {
  isSystem: boolean;
  conceptId: string;
  hasFrontmatter: boolean;
  parseError?: string;
  data: Record<string, unknown>;
}

function isPresent(value: unknown): boolean {
  if (value == null) return false;
  if (value instanceof Date) return true;
  if (typeof value === 'string') return value.trim() !== '';
  return true;
}

/**
 * Compute a node's OKF conformance verdict. `errors` map to the spec §9 rules
 * (parseable frontmatter mapping + non-empty `type`) plus the concept-id segment
 * rule; `missing` lists recommended-but-absent fields (advisory, does not affect
 * `ok`). Reserved files (index.md/log.md) are exempt.
 */
export function checkConformance(input: ConformanceInput): Conformance {
  const errors: string[] = [];
  const missing: string[] = [];

  if (input.isSystem) return { ok: true, errors, missing };

  for (const seg of input.conceptId.split('/')) {
    if (!SEGMENT_RE.test(seg)) errors.push(`invalid concept-id segment '${seg}'`);
  }

  if (input.parseError) {
    errors.push(input.parseError);
    return { ok: false, errors, missing };
  }
  if (!input.hasFrontmatter) {
    errors.push('no frontmatter block (a concept needs a `type`)');
    return { ok: false, errors, missing };
  }
  if (!isPresent(input.data.type)) {
    errors.push('missing or empty required `type` field');
  }
  for (const key of STRICT_KEYS) {
    if (!isPresent(input.data[key])) missing.push(key);
  }

  return { ok: errors.length === 0, errors, missing };
}
