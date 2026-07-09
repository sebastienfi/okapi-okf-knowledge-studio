// Re-export the shared graph/API contract from the core parser. These are
// type-only imports (erased at build), so the web bundle never pulls in the
// parser's runtime.
export type {
  BrokenLink,
  BundleMeta,
  Conformance,
  GraphEdge,
  GraphNode,
  GraphResponse,
  Neighbor,
  NodeDetail,
  TypeCount,
} from '@okapi/core';
