"use client";

import { useState, useCallback, useRef } from "react";
import WorkflowNode from "./WorkflowNode";
import WorkflowEdges from "./WorkflowEdges";
import NodeProperties from "./NodeProperties";
import { NODE_PALETTE, type WfNode, type WfEdge } from "./types";
import type { WorkflowNodeType } from "@/lib/crm/types";

interface WorkflowBuilderProps {
  initialNodes: WfNode[];
  initialEdges: WfEdge[];
  onChange: (nodes: WfNode[], edges: WfEdge[]) => void;
  readOnly?: boolean;
}

/**
 * Visual workflow builder canvas.
 * Drag nodes from the palette, connect them with edges, configure properties.
 */
export default function WorkflowBuilder({
  initialNodes,
  initialEdges,
  onChange,
  readOnly,
}: WorkflowBuilderProps) {
  const [nodes, setNodes] = useState<WfNode[]>(initialNodes);
  const [edges, setEdges] = useState<WfEdge[]>(initialEdges);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [drawingEdge, setDrawingEdge] = useState<{
    sourceId: string;
    handle: string;
    mouseX: number;
    mouseY: number;
  } | null>(null);

  const canvasRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{
    nodeId: string;
    offsetX: number;
    offsetY: number;
  } | null>(null);

  const selectedNode = nodes.find((n) => n.id === selectedId) ?? null;

  // ── Sync changes ──

  const emitChange = useCallback(
    (newNodes: WfNode[], newEdges: WfEdge[]) => {
      setNodes(newNodes);
      setEdges(newEdges);
      onChange(newNodes, newEdges);
    },
    [onChange]
  );

  // ── Node Dragging ──

  const handleNodeDragStart = useCallback(
    (nodeId: string, e: React.MouseEvent) => {
      if (readOnly) return;
      const node = nodes.find((n) => n.id === nodeId);
      if (!node) return;

      dragRef.current = {
        nodeId,
        offsetX: e.clientX - node.x,
        offsetY: e.clientY - node.y,
      };
    },
    [nodes, readOnly]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      // Node dragging
      if (dragRef.current) {
        const { nodeId, offsetX, offsetY } = dragRef.current;
        const newNodes = nodes.map((n) =>
          n.id === nodeId
            ? { ...n, x: e.clientX - offsetX, y: e.clientY - offsetY }
            : n
        );
        setNodes(newNodes);
        return;
      }

      // Edge drawing
      if (drawingEdge && canvasRef.current) {
        const rect = canvasRef.current.getBoundingClientRect();
        setDrawingEdge({
          ...drawingEdge,
          mouseX: e.clientX - rect.left,
          mouseY: e.clientY - rect.top,
        });
      }
    },
    [nodes, drawingEdge]
  );

  const handleMouseUp = useCallback(
    (e: React.MouseEvent) => {
      // Finish node drag
      if (dragRef.current) {
        const { nodeId, offsetX, offsetY } = dragRef.current;
        const newNodes = nodes.map((n) =>
          n.id === nodeId
            ? { ...n, x: e.clientX - offsetX, y: e.clientY - offsetY }
            : n
        );
        dragRef.current = null;
        emitChange(newNodes, edges);
        return;
      }

      // Finish edge drawing — check if we're over an input handle
      if (drawingEdge) {
        const target = document.elementFromPoint(e.clientX, e.clientY);
        const handleEl = target?.closest("[data-handle='input']");
        const targetNodeId = handleEl?.getAttribute("data-node-id");

        if (targetNodeId && targetNodeId !== drawingEdge.sourceId) {
          // Check for duplicate edge
          const exists = edges.some(
            (ed) =>
              ed.sourceId === drawingEdge.sourceId &&
              ed.targetId === targetNodeId &&
              ed.sourceHandle === drawingEdge.handle
          );

          if (!exists) {
            const newEdge: WfEdge = {
              id: crypto.randomUUID(),
              sourceId: drawingEdge.sourceId,
              targetId: targetNodeId,
              sourceHandle: drawingEdge.handle,
            };
            emitChange(nodes, [...edges, newEdge]);
          }
        }

        setDrawingEdge(null);
      }
    },
    [nodes, edges, drawingEdge, emitChange]
  );

  // ── Edge Drawing ──

  const handleConnectStart = useCallback(
    (nodeId: string, handle: string) => {
      if (readOnly) return;
      setDrawingEdge({ sourceId: nodeId, handle, mouseX: 0, mouseY: 0 });
    },
    [readOnly]
  );

  // ── Add Node from Palette ──

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      if (readOnly) return;
      e.preventDefault();
      const type = e.dataTransfer.getData("wf-node-type") as WorkflowNodeType;
      if (!type) return;

      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;

      const newNode: WfNode = {
        id: crypto.randomUUID(),
        type,
        label: NODE_PALETTE.find((p) => p.type === type)?.label ?? type,
        config: getDefaultConfig(type),
        x: e.clientX - rect.left - 90,
        y: e.clientY - rect.top - 35,
      };

      emitChange([...nodes, newNode], edges);
      setSelectedId(newNode.id);
    },
    [nodes, edges, readOnly, emitChange]
  );

  // ── Node Updates ──

  const updateNodeConfig = useCallback(
    (config: Record<string, unknown>) => {
      if (!selectedId) return;
      const newNodes = nodes.map((n) =>
        n.id === selectedId ? { ...n, config } : n
      );
      emitChange(newNodes, edges);
    },
    [selectedId, nodes, edges, emitChange]
  );

  const updateNodeLabel = useCallback(
    (label: string) => {
      if (!selectedId) return;
      const newNodes = nodes.map((n) =>
        n.id === selectedId ? { ...n, label } : n
      );
      emitChange(newNodes, edges);
    },
    [selectedId, nodes, edges, emitChange]
  );

  const deleteNode = useCallback(() => {
    if (!selectedId) return;
    const newNodes = nodes.filter((n) => n.id !== selectedId);
    const newEdges = edges.filter(
      (e) => e.sourceId !== selectedId && e.targetId !== selectedId
    );
    setSelectedId(null);
    emitChange(newNodes, newEdges);
  }, [selectedId, nodes, edges, emitChange]);

  return (
    <div className="flex gap-0 overflow-hidden rounded-lg border border-stone-light/20">
      {/* Left: Node Palette */}
      {!readOnly && (
        <div className="w-48 shrink-0 border-r border-stone-light/20 bg-offwhite/50 p-3">
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-text-secondary">
            Add Nodes
          </p>
          <div className="space-y-1.5">
            {NODE_PALETTE.map((item) => (
              <div
                key={item.type}
                draggable
                onDragStart={(e) => {
                  e.dataTransfer.setData("wf-node-type", item.type);
                  e.dataTransfer.effectAllowed = "copy";
                }}
                className="flex cursor-grab items-center gap-2 rounded-md border border-stone-light/20 bg-white px-2.5 py-2 transition-all hover:border-forest/30 hover:shadow-sm active:cursor-grabbing"
              >
                <span
                  className={`flex size-6 items-center justify-center rounded text-xs ${item.color}`}
                >
                  {item.icon}
                </span>
                <div>
                  <p className="text-[11px] font-medium text-text-primary">
                    {item.label}
                  </p>
                  <p className="text-[9px] text-text-light">
                    {item.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Center: Canvas */}
      <div
        ref={canvasRef}
        className="relative min-h-[500px] flex-1 cursor-default overflow-auto bg-white"
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
        onClick={() => setSelectedId(null)}
        style={{
          backgroundImage:
            "radial-gradient(circle, #e5e5e0 1px, transparent 1px)",
          backgroundSize: "20px 20px",
        }}
      >
        <WorkflowEdges
          nodes={nodes}
          edges={edges}
          drawingEdge={drawingEdge}
        />

        {nodes.map((node) => (
          <WorkflowNode
            key={node.id}
            node={node}
            selected={node.id === selectedId}
            onSelect={() => setSelectedId(node.id)}
            onDragStart={(e) => handleNodeDragStart(node.id, e)}
            onConnectStart={(handle) => handleConnectStart(node.id, handle)}
          />
        ))}

        {nodes.length === 0 && (
          <div className="flex h-full items-center justify-center">
            <p className="text-sm text-text-light">
              Drag nodes from the palette to start building your&nbsp;workflow
            </p>
          </div>
        )}
      </div>

      {/* Right: Properties */}
      {!readOnly && (
        <div className="w-56 shrink-0 border-l border-stone-light/20 bg-offwhite/50 p-3">
          {selectedNode ? (
            <NodeProperties
              node={selectedNode}
              onUpdate={updateNodeConfig}
              onUpdateLabel={updateNodeLabel}
              onDelete={deleteNode}
            />
          ) : (
            <div className="py-8 text-center">
              <p className="text-xs text-text-light">
                Select a node to edit its&nbsp;properties
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function getDefaultConfig(type: WorkflowNodeType): Record<string, unknown> {
  switch (type) {
    case "send_email":
      return { subject: "", html_body: "", from_name: "AnglerPass" };
    case "delay":
      return { duration: 1, unit: "days" };
    case "condition":
      return { field: "", operator: "eq", value: "" };
    case "split":
      return { split_percent: 50 };
    case "end":
      return {};
    default:
      return {};
  }
}
