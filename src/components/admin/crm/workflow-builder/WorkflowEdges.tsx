"use client";

import type { WfNode, WfEdge } from "./types";

interface WorkflowEdgesProps {
  nodes: WfNode[];
  edges: WfEdge[];
  /** Temporary edge being drawn by the user */
  drawingEdge: { sourceId: string; handle: string; mouseX: number; mouseY: number } | null;
}

const NODE_WIDTH = 180;
const NODE_HEIGHT = 70;

/**
 * SVG overlay that renders edges (connections) between workflow nodes.
 * Uses bezier curves for smooth paths.
 */
export default function WorkflowEdges({
  nodes,
  edges,
  drawingEdge,
}: WorkflowEdgesProps) {
  const nodeMap = new Map(nodes.map((n) => [n.id, n]));

  return (
    <svg className="pointer-events-none absolute inset-0 size-full overflow-visible">
      <defs>
        <marker
          id="arrowhead"
          markerWidth="8"
          markerHeight="6"
          refX="8"
          refY="3"
          orient="auto"
          fill="#5a5a52"
        >
          <polygon points="0 0, 8 3, 0 6" />
        </marker>
        <marker
          id="arrowhead-yes"
          markerWidth="8"
          markerHeight="6"
          refX="8"
          refY="3"
          orient="auto"
          fill="#1a3a2a"
        >
          <polygon points="0 0, 8 3, 0 6" />
        </marker>
        <marker
          id="arrowhead-no"
          markerWidth="8"
          markerHeight="6"
          refX="8"
          refY="3"
          orient="auto"
          fill="#ef4444"
        >
          <polygon points="0 0, 8 3, 0 6" />
        </marker>
      </defs>

      {edges.map((edge) => {
        const source = nodeMap.get(edge.sourceId);
        const target = nodeMap.get(edge.targetId);
        if (!source || !target) return null;

        const [sx, sy] = getOutputPos(source, edge.sourceHandle);
        const [tx, ty] = getInputPos(target);

        const isYes = edge.sourceHandle === "yes" || edge.sourceHandle === "a";
        const isNo = edge.sourceHandle === "no" || edge.sourceHandle === "b";
        const stroke = isYes ? "#1a3a2a" : isNo ? "#ef4444" : "#5a5a52";
        const marker = isYes ? "url(#arrowhead-yes)" : isNo ? "url(#arrowhead-no)" : "url(#arrowhead)";

        const path = buildBezier(sx, sy, tx, ty);

        return (
          <path
            key={edge.id}
            d={path}
            fill="none"
            stroke={stroke}
            strokeWidth={2}
            strokeDasharray={isNo ? "6 3" : undefined}
            markerEnd={marker}
            opacity={0.7}
          />
        );
      })}

      {/* Drawing edge (temporary) */}
      {drawingEdge && (() => {
        const source = nodeMap.get(drawingEdge.sourceId);
        if (!source) return null;
        const [sx, sy] = getOutputPos(source, drawingEdge.handle);
        const path = buildBezier(sx, sy, drawingEdge.mouseX, drawingEdge.mouseY);

        return (
          <path
            d={path}
            fill="none"
            stroke="#9a9a8e"
            strokeWidth={2}
            strokeDasharray="4 4"
            opacity={0.5}
          />
        );
      })()}
    </svg>
  );
}

function getOutputPos(node: WfNode, handle: string): [number, number] {
  const cx = node.x + NODE_WIDTH / 2;
  const bottom = node.y + NODE_HEIGHT;

  if (handle === "yes" || handle === "a") {
    return [node.x + 24, bottom + 8];
  }
  if (handle === "no" || handle === "b") {
    return [node.x + NODE_WIDTH - 24, bottom + 8];
  }
  return [cx, bottom + 8];
}

function getInputPos(node: WfNode): [number, number] {
  return [node.x + NODE_WIDTH / 2, node.y - 8];
}

function buildBezier(
  sx: number,
  sy: number,
  tx: number,
  ty: number
): string {
  const dy = Math.abs(ty - sy);
  const cp = Math.max(30, dy * 0.4);
  return `M ${sx} ${sy} C ${sx} ${sy + cp}, ${tx} ${ty - cp}, ${tx} ${ty}`;
}
