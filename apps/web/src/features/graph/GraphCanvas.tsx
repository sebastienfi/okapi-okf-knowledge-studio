import { useEffect, useMemo, useRef } from 'react';
import ForceGraph2D, { type ForceGraphMethods } from 'react-force-graph-2d';
import type { GraphNode, GraphResponse } from '../../api/types';
import { buildTypeColorMap, colorForType } from '../../lib/colorForType';
import { resolveThemeColors, withAlpha } from '../../lib/theme-colors';
import { useMeasure } from '../../lib/useMeasure';
import { useAppStore } from '../../store/useAppStore';

const TAU = Math.PI * 2;
const FONT = "'Inter Variable', ui-sans-serif, system-ui, sans-serif";

type GNode = GraphNode & { x?: number; y?: number };
interface GLink {
  id: string;
  source: string | GNode;
  target: string | GNode;
  fromSystem: boolean;
}

function radius(node: GraphNode): number {
  return Math.max(2.4, Math.sqrt(Math.max(node.degree, 1)) * 1.7);
}

function endpointId(x: string | GNode): string {
  return typeof x === 'object' ? x.id : x;
}

export function GraphCanvas({ graph }: { graph: GraphResponse }) {
  const [wrapRef, size] = useMeasure<HTMLDivElement>();
  // biome-ignore lint/suspicious/noExplicitAny: force-graph's generic ref is awkward to type precisely
  const fgRef = useRef<ForceGraphMethods<any, any>>(undefined);
  const fittedRef = useRef(false);

  const theme = useAppStore((s) => s.theme);
  const selectedId = useAppStore((s) => s.selectedId);
  const hoveredId = useAppStore((s) => s.hoveredId);
  const disabledTypes = useAppStore((s) => s.disabledTypes);
  const showSystem = useAppStore((s) => s.showSystem);
  const fitSignal = useAppStore((s) => s.fitSignal);
  const select = useAppStore((s) => s.select);
  const setHovered = useAppStore((s) => s.setHovered);

  const colors = useMemo(() => resolveThemeColors(theme), [theme]);
  const typeColorMap = useMemo(
    () =>
      buildTypeColorMap(
        graph.meta.types.map((t) => t.type),
        theme,
      ),
    [graph.meta.types, theme],
  );

  // Preserve node object identity across graph refetches so positions persist.
  const nodesRef = useRef(new Map<string, GNode>());
  const data = useMemo(() => {
    const cache = nodesRef.current;
    const ids = new Set(graph.nodes.map((n) => n.id));
    for (const id of [...cache.keys()]) if (!ids.has(id)) cache.delete(id);
    for (const n of graph.nodes) {
      const existing = cache.get(n.id);
      if (existing) Object.assign(existing, n);
      else cache.set(n.id, { ...n });
    }
    const nodes = graph.nodes.map((n) => cache.get(n.id) as GNode);
    const links: GLink[] = graph.edges.map((e) => ({
      id: e.id,
      source: e.source,
      target: e.target,
      fromSystem: e.fromSystem,
    }));
    return { nodes, links };
  }, [graph]);

  const focusId = hoveredId ?? selectedId;
  const highlight = useMemo(() => {
    if (!focusId) return null;
    const nodes = new Set<string>([focusId]);
    const links = new Set<string>();
    for (const e of graph.edges) {
      if (e.source === focusId || e.target === focusId) {
        nodes.add(e.source);
        nodes.add(e.target);
        links.add(e.id);
      }
    }
    return { nodes, links };
  }, [focusId, graph.edges]);

  const isVisibleNode = (node: GNode): boolean =>
    (showSystem || !node.isSystem) && !(node.type != null && disabledTypes.has(node.type));

  // Center the graph on the selected node.
  useEffect(() => {
    if (!selectedId) return;
    const node = nodesRef.current.get(selectedId);
    const fg = fgRef.current;
    if (fg && node && node.x != null && node.y != null) {
      fg.centerAt(node.x, node.y, 700);
      const current = fg.zoom();
      if (current < 1.6) fg.zoom(2.2, 700);
    }
  }, [selectedId]);

  // Fit on demand.
  useEffect(() => {
    if (fitSignal > 0) fgRef.current?.zoomToFit(500, 70);
  }, [fitSignal]);

  // Tune the force layout once the graph mounts for a spread, legible layout.
  const configuredRef = useRef(false);
  useEffect(() => {
    const fg = fgRef.current;
    if (!fg || configuredRef.current) return;
    const charge = fg.d3Force('charge');
    if (charge) charge.strength(-180).distanceMax(420);
    const link = fg.d3Force('link');
    if (link) link.distance(52);
    configuredRef.current = true;
    fg.d3ReheatSimulation();
  });

  useEffect(() => {
    fittedRef.current = false;
  }, []);

  const dimEdge = theme === 'dark' ? 'rgba(255,255,255,0.035)' : 'rgba(10,12,24,0.04)';

  return (
    <div ref={wrapRef} className="absolute inset-0">
      {size.width > 0 && (
        <ForceGraph2D
          ref={fgRef}
          width={size.width}
          height={size.height}
          graphData={data}
          backgroundColor="rgba(0,0,0,0)"
          nodeId="id"
          nodeRelSize={1.7}
          cooldownTime={4000}
          d3AlphaDecay={0.035}
          d3VelocityDecay={0.32}
          warmupTicks={20}
          onEngineStop={() => {
            if (!fittedRef.current) {
              fittedRef.current = true;
              fgRef.current?.zoomToFit(400, 80);
            }
          }}
          nodeVisibility={(n: GNode) => isVisibleNode(n)}
          linkVisibility={(l: GLink) => {
            const s = nodesRef.current.get(endpointId(l.source));
            const t = nodesRef.current.get(endpointId(l.target));
            return !!s && !!t && isVisibleNode(s) && isVisibleNode(t);
          }}
          linkColor={(l: GLink) => {
            if (!highlight) return colors.edge;
            return highlight.links.has(l.id) ? colors.edgeStrong : dimEdge;
          }}
          linkWidth={(l: GLink) => (highlight?.links.has(l.id) ? 1.8 : 0.6)}
          linkDirectionalArrowLength={(l: GLink) => (highlight?.links.has(l.id) ? 3.5 : 0)}
          linkDirectionalArrowRelPos={1}
          onNodeClick={(n: GNode) => select(n.id)}
          onNodeHover={(n: GNode | null) => setHovered(n?.id ?? null)}
          onBackgroundClick={() => select(null)}
          nodePointerAreaPaint={(node: GNode, color: string, ctx: CanvasRenderingContext2D) => {
            if (node.x == null || node.y == null) return;
            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.arc(node.x, node.y, radius(node) + 2, 0, TAU);
            ctx.fill();
          }}
          nodeCanvasObject={(node: GNode, ctx: CanvasRenderingContext2D, scale: number) => {
            if (node.x == null || node.y == null) return;
            const dim = highlight ? !highlight.nodes.has(node.id) : false;
            const base = colorForType(node.type, node.isSystem, typeColorMap, theme);
            const fill = dim ? withAlpha(base, 0.12) : base;
            const r = radius(node);

            ctx.beginPath();
            if (node.isSystem) {
              ctx.moveTo(node.x, node.y - r);
              ctx.lineTo(node.x + r, node.y);
              ctx.lineTo(node.x, node.y + r);
              ctx.lineTo(node.x - r, node.y);
              ctx.closePath();
            } else {
              ctx.arc(node.x, node.y, r, 0, TAU);
            }
            ctx.fillStyle = fill;
            ctx.fill();

            if (node.id === selectedId) {
              ctx.lineWidth = 2.4 / scale;
              ctx.strokeStyle = colors.brand;
              ctx.beginPath();
              ctx.arc(node.x, node.y, r + 4 / scale, 0, TAU);
              ctx.stroke();
            }

            const showLabel =
              !dim &&
              (scale > 1.5 ||
                node.id === selectedId ||
                node.id === hoveredId ||
                (!!highlight && highlight.nodes.has(node.id)));
            if (showLabel) {
              const fontSize = Math.max(2.6, 11 / scale);
              ctx.font = `${fontSize}px ${FONT}`;
              ctx.textAlign = 'center';
              ctx.textBaseline = 'top';
              ctx.fillStyle = colors.fg;
              ctx.fillText(node.title, node.x, node.y + r + 2 / scale);
            }
          }}
        />
      )}
    </div>
  );
}
