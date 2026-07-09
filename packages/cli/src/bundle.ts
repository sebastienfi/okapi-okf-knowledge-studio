import fs from 'node:fs/promises';
import path from 'node:path';
import { buildGraph, readNodeDetail } from '@okapi/core';
import type { GraphNode, GraphResponse, NodeDetail } from '@okapi/core';

/**
 * Holds the parsed bundle in memory and exposes read/refresh operations. The
 * graph is rebuilt on demand (after a save or a watched change).
 */
export class Bundle {
  readonly root: string;
  private graphData!: GraphResponse;
  private nodesById!: Map<string, GraphNode>;

  private constructor(root: string) {
    this.root = root;
  }

  static async open(rootArg: string): Promise<Bundle> {
    const resolved = path.resolve(rootArg);
    const stat = await fs.stat(resolved).catch(() => null);
    if (!stat || !stat.isDirectory()) {
      throw new Error(`Not a directory: ${rootArg}`);
    }
    // Resolve symlinks once so every later containment check compares realpaths.
    const real = await fs.realpath(resolved);
    const bundle = new Bundle(real);
    await bundle.rebuild();
    if (bundle.graphData.meta.counts.nodes === 0) {
      throw new Error(`No markdown files found in "${rootArg}" - is this an OKF bundle?`);
    }
    return bundle;
  }

  async rebuild(): Promise<void> {
    this.graphData = await buildGraph(this.root);
    this.nodesById = new Map(this.graphData.nodes.map((n) => [n.id, n]));
  }

  get graph(): GraphResponse {
    return this.graphData;
  }

  getNode(id: string): GraphNode | undefined {
    return this.nodesById.get(id);
  }

  async nodeDetail(id: string): Promise<NodeDetail | undefined> {
    const node = this.nodesById.get(id);
    if (!node) return undefined;
    return readNodeDetail(this.root, node, this.graphData.edges, this.nodesById);
  }
}
