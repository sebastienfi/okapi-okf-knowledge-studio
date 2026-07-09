/**
 * Shared OKF graph/API contract. Imported by both the server (packages/cli)
 * and the web app (apps/web) so there is a single source of truth.
 */

/** A resolved link that points at an in-bundle `.md` file that does not exist. */
export interface BrokenLink {
  /** The raw href as written in the markdown, e.g. "/model/ghost.md". */
  raw: string;
  /** The normalized bundle-relative target it resolved to, e.g. "model/ghost.md". */
  resolved: string;
}

/** Per-node OKF conformance verdict (spec §9 + concept-id segment rule). */
export interface Conformance {
  ok: boolean;
  /** Human-readable problems, e.g. ["missing or empty required `type`"]. */
  errors: string[];
  /** Recommended-but-absent fields (title/description/timestamp) - advisory. */
  missing: string[];
}

export type SystemKind = 'index' | 'log' | null;

/** A node in the OKF document graph. One per `.md` file. */
export interface GraphNode {
  /** Bundle-root-relative POSIX path WITH extension, e.g. "model/author.md". Canonical id. */
  id: string;
  /** Same as `id`; explicit for clarity at call sites. */
  path: string;
  /** `id` without the `.md` extension, e.g. "model/author" (OKF concept id). */
  conceptId: string;
  /** Parent directory for grouping, e.g. "model" ("" for the bundle root). */
  dir: string;
  /** Basename, e.g. "author.md". */
  name: string;
  /** frontmatter.title, else a humanized filename. */
  title: string;
  /** frontmatter.type (categorical - drives color). null for system/parse-error nodes. */
  type: string | null;
  description: string | null;
  tags: string[];
  timestamp: string | null;
  /** Provenance pointer; display-only, NEVER an edge. */
  resource: string | null;
  /** Reserved structural file (index.md / log.md). */
  isSystem: boolean;
  systemKind: SystemKind;
  hasFrontmatter: boolean;
  /** Total distinct incident edges (drives node size). */
  degree: number;
  inDegree: number;
  outDegree: number;
  conformance: Conformance;
  brokenLinks: BrokenLink[];
  /** Set when frontmatter failed to parse (e.g. unterminated block). Never crashes the graph. */
  parseError?: string;
  /** All frontmatter keys not otherwise surfaced, preserved verbatim (OKF requires this). */
  extra: Record<string, unknown>;
  sizeBytes: number;
  /** ISO 8601 mtime of the file on disk. */
  mtime: string;
}

/** A directed edge in the document graph, derived from a markdown link. */
export interface GraphEdge {
  /** "source->target". */
  id: string;
  source: string;
  target: string;
  kind: 'link' | 'similarity';
  /** For links: number of collapsed links source->target. For similarity: cosine score. */
  weight: number;
  /** Anchor texts of the underlying link(s). */
  labels: string[];
  /** True when the source is a system node (index.md/log.md) - lets the UI hide nav fan-out. */
  fromSystem: boolean;
}

export interface TypeCount {
  type: string;
  count: number;
}

export interface BundleMeta {
  /** Basename of the bundle directory (no absolute path is ever leaked to the client). */
  bundleName: string;
  okfVersion: string | null;
  generatedAt: string;
  counts: {
    nodes: number;
    concepts: number;
    system: number;
    edges: number;
    brokenLinks: number;
  };
  types: TypeCount[];
}

export interface GraphResponse {
  meta: BundleMeta;
  nodes: GraphNode[];
  edges: GraphEdge[];
}

/** A neighbor reference for the detail panel. */
export interface Neighbor {
  id: string;
  title: string;
  type: string | null;
  direction: 'out' | 'in';
}

/** Full detail for a single node (GET /api/node). */
export interface NodeDetail {
  node: GraphNode;
  /** Exact file bytes (frontmatter + body). */
  raw: string;
  /** Content with the frontmatter block removed. */
  body: string;
  /** Parsed frontmatter mapping, including unknown keys. */
  frontmatter: Record<string, unknown>;
  neighbors: Neighbor[];
  /** sha256 of `raw`, for optimistic concurrency on save. */
  hash: string;
  mtime: string;
}
