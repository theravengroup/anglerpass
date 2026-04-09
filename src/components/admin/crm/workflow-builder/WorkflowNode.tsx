"use client";

import { NODE_COLORS, NODE_ICONS, type WfNode } from "./types";

interface WorkflowNodeProps {
  node: WfNode;
  selected: boolean;
  onSelect: () => void;
  onDragStart: (e: React.MouseEvent) => void;
  onConnectStart: (handle: string) => void;
}

/**
 * Individual workflow node rendered on the canvas.
 * Shows type icon, label, and connection handles.
 */
export default function WorkflowNode({
  node,
  selected,
  onSelect,
  onDragStart,
  onConnectStart,
}: WorkflowNodeProps) {
  const colorClass = NODE_COLORS[node.type];
  const icon = NODE_ICONS[node.type];
  const isCondition = node.type === "condition";
  const isSplit = node.type === "split";
  const hasMultipleOutputs = isCondition || isSplit;

  return (
    <div
      className={`absolute select-none rounded-lg border-2 shadow-sm transition-shadow ${colorClass} ${
        selected ? "ring-2 ring-forest ring-offset-1 shadow-md" : "hover:shadow-md"
      }`}
      data-node-id={node.id}
      onMouseDown={(e) => {
        e.stopPropagation();
        onSelect();
        onDragStart(e);
      }}
      style={{
        left: node.x,
        top: node.y,
        width: 180,
        cursor: "grab",
      }}
    >
      {/* Input handle (top) — not on trigger nodes */}
      {node.type !== "trigger" && (
        <div
          className="absolute -top-2 left-1/2 size-4 -translate-x-1/2 cursor-crosshair rounded-full border-2 border-white bg-charcoal shadow-sm"
          data-handle="input"
          data-node-id={node.id}
          title="Drop connection here"
        />
      )}

      {/* Node content */}
      <div className="px-3 py-2.5">
        <div className="flex items-center gap-2">
          <span className="text-sm">{icon}</span>
          <span className="truncate text-xs font-semibold text-text-primary">
            {node.label || node.type}
          </span>
        </div>

        {/* Config summary */}
        <NodeConfigSummary node={node} />
      </div>

      {/* Output handles */}
      {node.type !== "end" && (
        <>
          {hasMultipleOutputs ? (
            <div className="flex justify-between px-6 pb-1">
              <div
                className="relative -mb-2 size-4 cursor-crosshair rounded-full border-2 border-white bg-forest shadow-sm"
                data-handle={isCondition ? "yes" : "a"}
                title={isCondition ? "Yes" : "Path A"}
                onMouseDown={(e) => {
                  e.stopPropagation();
                  onConnectStart(isCondition ? "yes" : "a");
                }}
              >
                <span className="absolute -bottom-3.5 left-1/2 -translate-x-1/2 text-[8px] font-bold text-forest">
                  {isCondition ? "Y" : "A"}
                </span>
              </div>
              <div
                className="relative -mb-2 size-4 cursor-crosshair rounded-full border-2 border-white bg-red-400 shadow-sm"
                data-handle={isCondition ? "no" : "b"}
                title={isCondition ? "No" : "Path B"}
                onMouseDown={(e) => {
                  e.stopPropagation();
                  onConnectStart(isCondition ? "no" : "b");
                }}
              >
                <span className="absolute -bottom-3.5 left-1/2 -translate-x-1/2 text-[8px] font-bold text-red-400">
                  {isCondition ? "N" : "B"}
                </span>
              </div>
            </div>
          ) : (
            <div className="flex justify-center pb-1">
              <div
                className="-mb-2 size-4 cursor-crosshair rounded-full border-2 border-white bg-charcoal shadow-sm"
                data-handle="default"
                title="Drag to connect"
                onMouseDown={(e) => {
                  e.stopPropagation();
                  onConnectStart("default");
                }}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
}

/** Shows a brief summary of the node's configuration */
function NodeConfigSummary({ node }: { node: WfNode }) {
  const c = node.config;

  switch (node.type) {
    case "trigger":
      return (
        <p className="mt-0.5 truncate text-[10px] text-text-light">
          {(c.event as string) ?? "When triggered"}
        </p>
      );
    case "send_email":
      return (
        <p className="mt-0.5 truncate text-[10px] text-text-light">
          {(c.subject as string) || "No subject set"}
        </p>
      );
    case "delay": {
      const dur = (c.duration as number) ?? 1;
      const unit = (c.unit as string) ?? "days";
      return (
        <p className="mt-0.5 text-[10px] text-text-light">
          Wait {dur} {unit}
        </p>
      );
    }
    case "condition":
      return (
        <p className="mt-0.5 truncate text-[10px] text-text-light">
          {(c.field as string) || "No condition set"}
          {c.operator ? ` ${c.operator}` : ""}
          {c.value ? ` "${c.value}"` : ""}
        </p>
      );
    case "split":
      return (
        <p className="mt-0.5 text-[10px] text-text-light">
          {(c.split_percent as number) ?? 50}% / {100 - ((c.split_percent as number) ?? 50)}%
        </p>
      );
    default:
      return null;
  }
}
