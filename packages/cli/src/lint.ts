import { buildGraph } from '@okapi/core';
import type { GraphResponse } from '@okapi/core';

export interface LintOptions {
  strict?: boolean;
  checkLinks?: boolean;
}

export interface LintResult {
  graph: GraphResponse;
  errors: string[];
  missing: string[];
  dangling: string[];
  conformant: boolean;
}

/** Run OKF conformance over a bundle, mirroring `validate_okf.py`'s verdict. */
export async function lintBundle(root: string, opts: LintOptions = {}): Promise<LintResult> {
  const graph = await buildGraph(root);
  const errors: string[] = [];
  const missing: string[] = [];
  const dangling: string[] = [];

  for (const node of graph.nodes) {
    for (const err of node.conformance.errors) errors.push(`${node.id}: ${err}`);
    if (opts.strict) {
      for (const key of node.conformance.missing) {
        missing.push(`${node.id}: --strict: missing or empty \`${key}\``);
      }
    }
    if (opts.checkLinks) {
      for (const link of node.brokenLinks) {
        dangling.push(`${node.id}: dangling link -> ${link.raw}`);
      }
    }
  }

  const conformant = errors.length === 0 && (!opts.strict || missing.length === 0);
  return { graph, errors, missing, dangling, conformant };
}
