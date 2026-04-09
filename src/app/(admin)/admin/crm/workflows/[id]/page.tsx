"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Loader2,
  Play,
  Pause,
  Save,
} from "lucide-react";
import AdminPageGuard from "@/components/admin/AdminPageGuard";
import CampaignStatusBadge from "@/components/admin/crm/CampaignStatusBadge";
import { WorkflowBuilder, type WfNode, type WfEdge } from "@/components/admin/crm/workflow-builder";
import type { CampaignStatus } from "@/lib/crm/types";

interface WorkflowDetail {
  id: string;
  name: string;
  description: string | null;
  status: string;
  trigger_event: string | null;
  nodes: ServerNode[];
  edges: ServerEdge[];
}

interface ServerNode {
  id: string;
  type: string;
  label: string;
  config: Record<string, unknown>;
  position_x: number;
  position_y: number;
}

interface ServerEdge {
  id: string;
  source_node_id: string;
  target_node_id: string;
  source_handle: string;
}

export default function WorkflowDetailPage() {
  const params = useParams();
  const router = useRouter();
  const workflowId = params.id as string;

  const [workflow, setWorkflow] = useState<WorkflowDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [hasUnsaved, setHasUnsaved] = useState(false);

  // Track latest nodes/edges from builder
  const nodesRef = useRef<WfNode[]>([]);
  const edgesRef = useRef<WfEdge[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/crm/workflows/${workflowId}`);
      if (!res.ok) {
        router.push("/admin/crm/workflows");
        return;
      }
      const data = await res.json();
      const wf = data.workflow as WorkflowDetail;
      setWorkflow(wf);
      setName(wf.name);
      setDescription(wf.description ?? "");

      // Convert server format to builder format
      nodesRef.current = wf.nodes.map((n) => ({
        id: n.id,
        type: n.type as WfNode["type"],
        label: n.label,
        config: n.config,
        x: n.position_x,
        y: n.position_y,
      }));
      edgesRef.current = wf.edges.map((e) => ({
        id: e.id,
        sourceId: e.source_node_id,
        targetId: e.target_node_id,
        sourceHandle: e.source_handle,
      }));
    } finally {
      setLoading(false);
    }
  }, [workflowId, router]);

  useEffect(() => {
    load();
  }, [load]);

  const handleBuilderChange = useCallback(
    (newNodes: WfNode[], newEdges: WfEdge[]) => {
      nodesRef.current = newNodes;
      edgesRef.current = newEdges;
      setHasUnsaved(true);
    },
    []
  );

  const saveWorkflow = async () => {
    setSaving(true);
    try {
      await fetch(`/api/admin/crm/workflows/${workflowId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          description: description || null,
          nodes: nodesRef.current.map((n) => ({
            id: n.id,
            type: n.type,
            label: n.label,
            config: n.config,
            position_x: n.x,
            position_y: n.y,
          })),
          edges: edgesRef.current.map((e) => ({
            id: e.id,
            source_node_id: e.sourceId,
            target_node_id: e.targetId,
            source_handle: e.sourceHandle,
          })),
        }),
      });
      setHasUnsaved(false);
      load();
    } finally {
      setSaving(false);
    }
  };

  const activateWorkflow = async () => {
    // Save first if there are unsaved changes
    if (hasUnsaved) await saveWorkflow();

    setActionLoading("activate");
    try {
      const res = await fetch(
        `/api/admin/crm/workflows/${workflowId}/activate`,
        { method: "POST" }
      );
      if (res.ok) {
        load();
      } else {
        const data = await res.json();
        alert(data.error ?? "Activation failed");
      }
    } finally {
      setActionLoading(null);
    }
  };

  const pauseWorkflow = async () => {
    setActionLoading("pause");
    try {
      const res = await fetch(
        `/api/admin/crm/workflows/${workflowId}/pause`,
        { method: "POST" }
      );
      if (res.ok) {
        load();
      } else {
        const data = await res.json();
        alert(data.error ?? "Pause failed");
      }
    } finally {
      setActionLoading(null);
    }
  };

  const isEditable =
    workflow?.status === "draft" || workflow?.status === "paused";

  if (loading) {
    return (
      <AdminPageGuard path="/admin/crm">
        <div className="flex items-center justify-center py-24">
          <Loader2 className="size-6 animate-spin text-charcoal" />
        </div>
      </AdminPageGuard>
    );
  }

  if (!workflow) return null;

  return (
    <AdminPageGuard path="/admin/crm">
      <div className="space-y-4">
        {/* Header */}
        <div>
          <button
            onClick={() => router.push("/admin/crm/workflows")}
            className="mb-3 flex items-center gap-1 text-xs text-text-secondary hover:text-text-primary"
          >
            <ArrowLeft className="size-3.5" />
            All Workflows
          </button>

          <div className="flex items-start justify-between">
            <div className="flex-1">
              {isEditable ? (
                <input
                  type="text"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    setHasUnsaved(true);
                  }}
                  className="w-full bg-transparent font-heading text-2xl font-semibold text-text-primary focus:outline-none"
                />
              ) : (
                <h2 className="font-heading text-2xl font-semibold text-text-primary">
                  {workflow.name}
                </h2>
              )}
              <div className="mt-1 flex items-center gap-2">
                <CampaignStatusBadge
                  status={workflow.status as CampaignStatus}
                />
                {hasUnsaved && (
                  <span className="text-[10px] text-bronze">
                    Unsaved changes
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              {isEditable && (
                <>
                  <button
                    onClick={saveWorkflow}
                    disabled={saving}
                    className="flex items-center gap-1.5 rounded-md border border-stone-light/30 px-3 py-2 text-xs font-medium text-text-secondary hover:bg-offwhite disabled:opacity-50"
                  >
                    {saving ? (
                      <Loader2 className="size-3.5 animate-spin" />
                    ) : (
                      <Save className="size-3.5" />
                    )}
                    Save
                  </button>
                  <button
                    onClick={activateWorkflow}
                    disabled={actionLoading === "activate"}
                    className="flex items-center gap-1.5 rounded-md bg-forest px-3 py-2 text-xs font-medium text-white hover:bg-forest-deep disabled:opacity-50"
                  >
                    {actionLoading === "activate" ? (
                      <Loader2 className="size-3.5 animate-spin" />
                    ) : (
                      <Play className="size-3.5" />
                    )}
                    Activate
                  </button>
                </>
              )}

              {workflow.status === "active" && (
                <button
                  onClick={pauseWorkflow}
                  disabled={actionLoading === "pause"}
                  className="flex items-center gap-1.5 rounded-md bg-amber-500 px-3 py-2 text-xs font-medium text-white hover:bg-amber-600 disabled:opacity-50"
                >
                  {actionLoading === "pause" ? (
                    <Loader2 className="size-3.5 animate-spin" />
                  ) : (
                    <Pause className="size-3.5" />
                  )}
                  Pause
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Workflow Builder Canvas */}
        <WorkflowBuilder
          initialNodes={nodesRef.current}
          initialEdges={edgesRef.current}
          onChange={handleBuilderChange}
          readOnly={!isEditable}
        />
      </div>
    </AdminPageGuard>
  );
}
