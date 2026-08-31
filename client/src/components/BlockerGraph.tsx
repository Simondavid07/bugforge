import { trpc } from "@/lib/trpc";
import { AlertTriangle, ArrowRight, CheckCircle2, GitBranch, Layers, ShieldAlert } from "lucide-react";
import React, { useMemo, useState } from "react";
import { useLocation } from "wouter";

interface BlockerGraphProps {
  projectId: number;
  highlightIssueId?: number;
  className?: string;
}

export function BlockerGraph({
  projectId,
  highlightIssueId,
  className = "",
}: BlockerGraphProps) {
  const [, setLocation] = useLocation();
  const [selectedNodeId, setSelectedNodeId] = useState<number | null>(
    highlightIssueId ?? null
  );

  const graphQuery = trpc.issues.dependencyGraph.useQuery(
    { projectId },
    { enabled: projectId > 0 }
  );

  const { nodes, edges, criticalPath } = useMemo(() => {
    const data = graphQuery.data;
    if (!data) return { nodes: [], edges: [], criticalPath: [] };
    return data;
  }, [graphQuery.data]);

  // Layout calculation: group nodes into levels based on in-degree in the dependency graph
  const layout = useMemo(() => {
    if (!nodes.length) return { positionedNodes: [], svgWidth: 600, svgHeight: 280 };

    const inDeg = new Map<number, number>();
    const outgoing = new Map<number, number[]>();
    nodes.forEach(n => {
      inDeg.set(n.id, 0);
      outgoing.set(n.id, []);
    });

    edges.forEach(e => {
      outgoing.get(e.source)?.push(e.target);
      inDeg.set(e.target, (inDeg.get(e.target) ?? 0) + 1);
    });

    // Assign layers (X-axis)
    const layers = new Map<number, number>();
    const roots = nodes.filter(n => (inDeg.get(n.id) ?? 0) === 0);
    const queue = roots.map(r => ({ id: r.id, layer: 0 }));
    
    roots.forEach(r => layers.set(r.id, 0));
    while (queue.length > 0) {
      const { id, layer } = queue.shift()!;
      for (const next of outgoing.get(id) ?? []) {
        const nextLayer = Math.max(layers.get(next) ?? 0, layer + 1);
        layers.set(next, nextLayer);
        queue.push({ id: next, layer: nextLayer });
      }
    }

    nodes.forEach(n => {
      if (!layers.has(n.id)) layers.set(n.id, 0);
    });

    // Group nodes by layer
    const layerBuckets: number[][] = [];
    nodes.forEach(n => {
      const l = layers.get(n.id) ?? 0;
      while (layerBuckets.length <= l) layerBuckets.push([]);
      layerBuckets[l].push(n.id);
    });

    const nodeWidth = 170;
    const nodeHeight = 64;
    const colGap = 80;
    const rowGap = 24;

    const maxRows = Math.max(...layerBuckets.map(b => b.length), 1);
    const svgWidth = Math.max(layerBuckets.length * (nodeWidth + colGap) + 40, 520);
    const svgHeight = Math.max(maxRows * (nodeHeight + rowGap) + 50, 220);

    const positions = new Map<number, { x: number; y: number }>();
    layerBuckets.forEach((bucket, colIndex) => {
      const totalColHeight = bucket.length * (nodeHeight + rowGap) - rowGap;
      const startY = (svgHeight - totalColHeight) / 2;
      bucket.forEach((nodeId, rowIndex) => {
        const x = 30 + colIndex * (nodeWidth + colGap);
        const y = startY + rowIndex * (nodeHeight + rowGap);
        positions.set(nodeId, { x, y });
      });
    });

    return {
      positionedNodes: nodes.map(n => ({
        ...n,
        ...(positions.get(n.id) ?? { x: 30, y: 30 }),
        width: nodeWidth,
        height: nodeHeight,
      })),
      svgWidth,
      svgHeight,
    };
  }, [nodes, edges]);

  const criticalSet = useMemo(() => new Set(criticalPath), [criticalPath]);
  const criticalEdges = useMemo(() => {
    const set = new Set<string>();
    for (let i = 0; i < criticalPath.length - 1; i++) {
      set.add(`${criticalPath[i]}->${criticalPath[i + 1]}`);
    }
    return set;
  }, [criticalPath]);

  const nodeMap = useMemo(() => {
    return new Map(layout.positionedNodes.map(n => [n.id, n]));
  }, [layout.positionedNodes]);

  if (graphQuery.isLoading) {
    return (
      <div className={`p-8 text-center bg-white/60 rounded-2xl border border-[#E8EAE3] ${className}`}>
        <div className="inline-block animate-spin h-6 w-6 border-2 border-[#18342C] border-t-transparent rounded-full mb-2" />
        <p className="text-xs text-[#718079]">Analyzing dependency topology...</p>
      </div>
    );
  }

  if (!nodes.length) {
    return (
      <div className={`p-6 text-center bg-white/60 rounded-2xl border border-[#E8EAE3] ${className}`}>
        <GitBranch className="h-8 w-8 text-[#8A978F] mx-auto mb-2 opacity-50" />
        <p className="text-xs font-semibold text-[#18342C]">No Dependency Relationships</p>
        <p className="text-[11px] text-[#718079] mt-0.5">
          Link issues with "blocks" or "blocked_by" to visualize bottleneck chains and critical paths.
        </p>
      </div>
    );
  }

  return (
    <div className={`soft-card p-5 overflow-hidden ${className}`}>
      {/* Header controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E8EAE3] pb-3.5 mb-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#FF7164]/15 text-[#D14336]">
            <GitBranch className="h-4 w-4" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-[#18342C] flex items-center gap-2">
              Interactive Dependency & Critical Path Graph
              {criticalPath.length > 0 && (
                <span className="inline-flex items-center gap-1 rounded-full bg-[#FF7164]/15 px-2 py-0.5 text-[10px] font-bold text-[#D14336]">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#D14336] animate-ping" />
                  {criticalPath.length}-Node Critical Path
                </span>
              )}
            </h3>
            <p className="text-[11px] text-[#718079]">
              Topological DAG with Kahn's cycle prevention and bottleneck tracing.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 text-[11px] text-[#718079]">
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-[#FF7164]" />
            <span>Critical Blocker</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-[#3ECF8E]" />
            <span>Resolved</span>
          </div>
        </div>
      </div>

      {/* SVG DAG Visualizer */}
      <div className="relative overflow-x-auto rounded-xl bg-[#FAFAF6] border border-[#E8EAE3]/80 p-2 min-h-[240px]">
        <svg
          width={layout.svgWidth}
          height={layout.svgHeight}
          className="mx-auto block select-none"
        >
          <defs>
            {/* Standard Arrow Marker */}
            <marker
              id="arrow-std"
              viewBox="0 0 10 10"
              refX="8"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M 0 1 L 10 5 L 0 9 z" fill="#8A978F" />
            </marker>

            {/* Critical Path Arrow Marker */}
            <marker
              id="arrow-crit"
              viewBox="0 0 10 10"
              refX="8"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M 0 1 L 10 5 L 0 9 z" fill="#FF7164" />
            </marker>
          </defs>

          {/* Edges */}
          {edges.map(e => {
            const s = nodeMap.get(e.source);
            const t = nodeMap.get(e.target);
            if (!s || !t) return null;

            const isCrit = criticalEdges.has(`${e.source}->${e.target}`);
            const x1 = s.x + s.width;
            const y1 = s.y + s.height / 2;
            const x2 = t.x;
            const y2 = t.y + t.height / 2;
            const dx = Math.max((x2 - x1) / 2, 20);

            const pathD = `M ${x1} ${y1} C ${x1 + dx} ${y1}, ${x2 - dx} ${y2}, ${x2} ${y2}`;

            return (
              <g key={e.id}>
                <path
                  d={pathD}
                  fill="none"
                  stroke={isCrit ? "#FF7164" : "#CBD5E1"}
                  strokeWidth={isCrit ? "2.5" : "1.5"}
                  strokeDasharray={isCrit ? "none" : "none"}
                  markerEnd={isCrit ? "url(#arrow-crit)" : "url(#arrow-std)"}
                  className={isCrit ? "animate-pulse" : ""}
                />
              </g>
            );
          })}

          {/* Nodes */}
          {layout.positionedNodes.map(node => {
            const isCrit = criticalSet.has(node.id);
            const isSelected = selectedNodeId === node.id;
            const isDone = node.status === "done";

            return (
              <g
                key={node.id}
                transform={`translate(${node.x}, ${node.y})`}
                onClick={() => {
                  setSelectedNodeId(node.id);
                  setLocation(`/issues/${node.id}`);
                }}
                className="cursor-pointer group"
              >
                {/* Node Box */}
                <rect
                  width={node.width}
                  height={node.height}
                  rx="10"
                  fill={isDone ? "#F4FAF6" : isCrit ? "#FFF5F4" : "#FFFFFF"}
                  stroke={
                    isSelected
                      ? "#18342C"
                      : isCrit
                      ? "#FF7164"
                      : isDone
                      ? "#A8E6CF"
                      : "#E1E5DB"
                  }
                  strokeWidth={isSelected || isCrit ? "2" : "1"}
                  className="transition-all duration-200 group-hover:filter group-hover:drop-shadow-sm"
                />

                {/* Node Header (Number + Status) */}
                <text
                  x="10"
                  y="20"
                  fontSize="10"
                  fontWeight="bold"
                  fill={isCrit ? "#D14336" : "#18342C"}
                >
                  #{node.number}
                </text>

                <rect
                  x={node.width - 60}
                  y="8"
                  width="50"
                  height="16"
                  rx="8"
                  fill={isDone ? "#D1FAE5" : isCrit ? "#FEE2E2" : "#F1F5F9"}
                />
                <text
                  x={node.width - 35}
                  y="19.5"
                  fontSize="8"
                  fontWeight="600"
                  textAnchor="middle"
                  fill={isDone ? "#065F46" : isCrit ? "#991B1B" : "#475569"}
                >
                  {node.status.toUpperCase()}
                </text>

                {/* Node Title */}
                <text
                  x="10"
                  y="40"
                  fontSize="10"
                  fontWeight="500"
                  fill="#334155"
                  className="truncate"
                >
                  {node.title.length > 22
                    ? `${node.title.slice(0, 20)}...`
                    : node.title}
                </text>

                {/* Node Footer Badges */}
                {node.isReleaseBlocker && (
                  <text
                    x="10"
                    y="55"
                    fontSize="8"
                    fontWeight="bold"
                    fill="#EF4444"
                  >
                    🚨 Blocker
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      </div>

      {criticalPath.length > 1 && (
        <div className="mt-3 flex items-center gap-2 rounded-xl bg-[#FFF5F4] p-2.5 text-xs text-[#D14336] border border-[#FF7164]/30">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span className="font-medium">
            <strong>Critical Path Bottleneck Chain:</strong>{" "}
            {criticalPath
              .map(id => `#${nodeMap.get(id)?.number ?? id}`)
              .join(" ➔ ")}
          </span>
        </div>
      )}
    </div>
  );
}
